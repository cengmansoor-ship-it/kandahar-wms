import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { checkDbConnection } from './config/db';
import inventoryRoutes from './routes/inventory.routes';
import requestRoutes from './routes/request.routes';
import procurementRoutes from './routes/procurement.routes';
import receivingRoutes from './routes/receiving.routes';
import deliveryRoutes from './routes/delivery.routes';
import reportsRoutes from './routes/reports.routes';
import lookupRoutes from './routes/lookup.routes';
import emailRoutes from './routes/email.routes';
import emailConfigRoutes from './routes/emailConfig.routes';
import traceabilityRoutes from './routes/traceability.routes';
import managementRoutes from './routes/management.routes';
import customRolesRoutes from './routes/customRoles.routes';
import budgetRoutes from './routes/budget.routes';
import trashRoutes from './routes/trash.routes';
import smsRoutes from './routes/sms.routes';
import checklistRoutes from './routes/checklist.routes';
import authRoutes from './routes/auth.routes';
import { BudgetService } from './services/budget.service';
import { TraceabilityService } from './services/traceability.service';
import { ManagementService } from './services/management.service';
import { EmailConfigService } from './services/emailConfig.service';
import { CustomRolesService } from './services/customRoles.service';
import { InventoryService } from './services/inventory.service';
import { RequestService } from './services/request.service';
import { TrashService } from './services/trash.service';
import { SmsService } from './services/sms.service';
import { ChecklistService } from './services/checklist.service';
import { BackupService } from './services/backup.service';
import backupRoutes from './routes/backup.routes';
import delegationRoutes from './routes/delegation.routes';
import { DelegationService } from './services/delegation.service';
import settingsRoutes from './routes/settings.routes';
import { SettingsService } from './services/settings.service';

// Load from backend/.env first, then root .env (supports single root .env on Windows)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

checkDbConnection();

// Schedule auto backup every 3 hours
BackupService.scheduleAutoBackup();

app.use('/api/inventory', inventoryRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/receiving', receivingRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/lookup', lookupRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/email-config', emailConfigRoutes);
app.use('/api/traceability', traceabilityRoutes);
app.use('/api/management', managementRoutes);
app.use('/api/custom-roles', customRolesRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/trash', trashRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/checklist', checklistRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/delegations', delegationRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ success: true, status: 'ok', service: 'Kandahar WMS Backend', timestamp: new Date().toISOString() });
});

app.get('/api/time/now', (req: Request, res: Response) => {
  const now = new Date();
  const shamsiDate = new Intl.DateTimeFormat('ps-AF-u-ca-persian', { year: 'numeric', month: 'long', day: 'numeric' }).format(now);
  const qamariDate = new Intl.DateTimeFormat('ps-AF-u-ca-islamic-uma', { year: 'numeric', month: 'long', day: 'numeric' }).format(now);
  const gregorianDate = new Intl.DateTimeFormat('ps-AF', { year: 'numeric', month: 'long', day: 'numeric' }).format(now);
  res.json({
    success: true,
    data: {
      isoDate: now.toISOString(),
      shamsiDate,
      qamariDate,
      gregorianDate,
      serverTime: now.getTime(),
    },
  });
});

// Serve built frontend in production
const distPath = path.join(__dirname, '../../dist');
const indexHtml = path.join(distPath, 'index.html');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req: Request, res: Response) => {
    if (fs.existsSync(indexHtml)) {
      res.sendFile(indexHtml);
    } else {
      res.status(404).json({ success: false, message: 'Frontend not built' });
    }
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Run all migrations sequentially after server is listening (avoids deadlocks)
  (async () => {
    try { await InventoryService.runBarcodeMigrations(); } catch(e: any) { console.warn('[WMS] Barcode migrations warning:', e.message); }
    try { await TraceabilityService.runMigrations(); console.log('[WMS] Traceability migrations complete.'); } catch(e: any) { console.warn('[WMS] Traceability migrations warning:', e.message); }
    try { await ManagementService.runMigrations(); console.log('[WMS] Management migrations complete.'); } catch(e: any) { console.warn('[WMS] Management migrations warning:', e.message); }
    try { await EmailConfigService.runMigrations(); console.log('[WMS] Email config migrations complete.'); } catch(e: any) { console.warn('[WMS] Email config migrations warning:', e.message); }
    try { await CustomRolesService.runMigrations(); console.log('[WMS] Custom roles migrations complete.'); } catch(e: any) { console.warn('[WMS] Custom roles migrations warning:', e.message); }
    try { await BudgetService.runMigrations(); console.log('[WMS] Budget migrations complete.'); } catch(e: any) { console.warn('[WMS] Budget migrations warning:', e.message); }
    try { await BudgetService.runCeilingMigration(); console.log('[WMS] Budget ceiling migration complete.'); } catch(e: any) { console.warn('[WMS] Budget ceiling migration warning:', e.message); }
    try { await RequestService.runMigrations(); console.log('[WMS] Request pipeline migrations complete.'); } catch(e: any) { console.warn('[WMS] Request pipeline migrations warning:', e.message); }
    try { await TrashService.runMigrations(); console.log('[WMS] Trash migrations complete.'); } catch(e: any) { console.warn('[WMS] Trash migrations warning:', e.message); }
    try { await TrashService.purgeExpired(30); } catch(e: any) { console.warn('[WMS] Trash purge warning:', e.message); }
    try { await SmsService.runMigrations(); console.log('[WMS] SMS config migrations complete.'); } catch(e: any) { console.warn('[WMS] SMS config migrations warning:', e.message); }
    try { await ChecklistService.runMigrations(); console.log('[WMS] Checklist migrations & seed complete.'); } catch(e: any) { console.warn('[WMS] Checklist migrations warning:', e.message); }
    try { await DelegationService.runMigration(); console.log('[WMS] Delegation migrations complete.'); } catch(e: any) { console.warn('[WMS] Delegation migration warning:', e.message); }
    try { await SettingsService.runMigrations(); console.log('[WMS] System settings migrations complete.'); } catch(e: any) { console.warn('[WMS] Settings migrations warning:', e.message); }
  })();
});
