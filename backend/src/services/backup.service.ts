import * as fs from 'fs';
import * as path from 'path';
import db from '../config/db';

const BACKUP_DIR = path.join(__dirname, '../../backups');

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function nowLabel(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
}

async function fetchTable(table: string): Promise<any[]> {
  try {
    const [rows] = await db.query(`SELECT * FROM \`${table}\``);
    return rows as any[];
  } catch {
    return [];
  }
}

export class BackupService {
  static async createBackup(): Promise<{ filename: string; filepath: string; tables: Record<string, number> }> {
    ensureBackupDir();

    // Dynamically import exceljs so startup doesn't fail if package is missing
    let ExcelJS: any;
    try {
      ExcelJS = require('exceljs');
    } catch {
      throw new Error('exceljs package not installed – run: npm install exceljs');
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator  = 'Kandahar University WMS';
    workbook.created  = new Date();
    workbook.modified = new Date();

    const TABLES: Record<string, string> = {
      items:                'اجناس',
      stock_movements:      'د ګدام حرکات',
      requests:             'غوښتنې',
      request_items:        'د غوښتنو اجناس',
      request_pipeline:     'پایپ لاین',
      procurement_tenders:  'تدارکات',
      vendor_offers:        'د پلورونکو آفرونه',
      users:                'کاروونکي',
      faculties:            'پوهنځیونه',
      departments:          'ډیپارتمنتونه',
      delivery_records:     'تسلیمي ریکارډونه',
      receiving_reports:    'رسید راپورونه',
      audit_logs:           'آډیټ لاګونه',
    };

    const tableCounts: Record<string, number> = {};

    for (const [tableName, sheetTitle] of Object.entries(TABLES)) {
      const rows = await fetchTable(tableName);
      tableCounts[tableName] = rows.length;
      if (rows.length === 0) continue;

      const sheet = workbook.addWorksheet(sheetTitle.substring(0, 31));
      const headers = Object.keys(rows[0]);

      // Header row
      sheet.addRow(headers).eachCell((cell: any) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
        cell.alignment = { horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' },
        };
      });

      // Data rows
      rows.forEach((row: any) => {
        const values = headers.map(h => {
          const v = row[h];
          if (v instanceof Date) return v.toISOString();
          if (typeof v === 'object' && v !== null) return JSON.stringify(v);
          return v ?? '';
        });
        const added = sheet.addRow(values);
        added.eachCell((cell: any) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          };
        });
      });

      // Auto width
      sheet.columns.forEach((col: any) => {
        let maxLen = 10;
        col.eachCell({ includeEmpty: true }, (cell: any) => {
          const len = cell.value ? String(cell.value).length : 0;
          if (len > maxLen) maxLen = len;
        });
        col.width = Math.min(maxLen + 2, 50);
      });
    }

    // Summary sheet
    const summary = workbook.addWorksheet('خلاصه');
    summary.addRow(['جدول', 'د ریکارډونو شمیر', 'د بیکپ نیټه']).eachCell((cell: any) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    });
    summary.addRow(['د کندهار پوهنتون ګدام مدیریت سیستم', '', new Date().toISOString()]);
    Object.entries(tableCounts).forEach(([t, c]) => {
      summary.addRow([TABLES[t] || t, c, '']);
    });
    summary.columns = [{ width: 30 }, { width: 20 }, { width: 30 }];

    const filename = `WMS_Backup_${nowLabel()}.xlsx`;
    const filepath = path.join(BACKUP_DIR, filename);
    await workbook.xlsx.writeFile(filepath);

    // Keep only last 50 backups to avoid disk fill
    BackupService.pruneOldBackups(50);

    console.log(`[BACKUP] Created: ${filename} | Tables: ${Object.values(tableCounts).reduce((a, b) => a + b, 0)} records`);
    return { filename, filepath, tables: tableCounts };
  }

  static listBackups(): { filename: string; size: number; createdAt: string }[] {
    ensureBackupDir();
    try {
      return fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith('.xlsx'))
        .map(f => {
          const stat = fs.statSync(path.join(BACKUP_DIR, f));
          return { filename: f, size: stat.size, createdAt: stat.mtime.toISOString() };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  }

  static getBackupPath(filename: string): string | null {
    ensureBackupDir();
    // Safety: only allow safe filenames
    const safe = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '');
    if (safe !== filename) return null;
    const fp = path.join(BACKUP_DIR, safe);
    return fs.existsSync(fp) ? fp : null;
  }

  static deleteBackup(filename: string): boolean {
    const fp = BackupService.getBackupPath(filename);
    if (!fp) return false;
    fs.unlinkSync(fp);
    return true;
  }

  static pruneOldBackups(keepCount: number) {
    try {
      const files = BackupService.listBackups();
      files.slice(keepCount).forEach(f => {
        const fp = path.join(BACKUP_DIR, f.filename);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      });
    } catch {}
  }

  static scheduleAutoBackup() {
    let cron: any;
    try {
      cron = require('node-cron');
    } catch {
      console.warn('[BACKUP] node-cron not installed; auto-backup disabled.');
      return;
    }

    // Every 3 hours: "0 */3 * * *"
    cron.schedule('0 */3 * * *', async () => {
      console.log('[BACKUP] Starting scheduled 3-hour backup...');
      try {
        const result = await BackupService.createBackup();
        console.log(`[BACKUP] Scheduled backup complete: ${result.filename}`);
      } catch (err: any) {
        console.error('[BACKUP] Scheduled backup failed:', err.message);
      }
    });

    console.log('[BACKUP] Auto-backup scheduled every 3 hours.');
  }
}
