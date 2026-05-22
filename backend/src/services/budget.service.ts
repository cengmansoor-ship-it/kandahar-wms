import pool from '../config/db';

export class BudgetService {
  static async runMigrations() {
    const conn = await pool.getConnection();
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS budget_babs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          bab_code VARCHAR(20) NOT NULL,
          name_ps VARCHAR(200) NOT NULL,
          name_fa VARCHAR(200) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          is_deleted TINYINT(1) DEFAULT 0,
          UNIQUE KEY uq_bab_code (bab_code),
          INDEX idx_bab_code (bab_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      await conn.query(`
        CREATE TABLE IF NOT EXISTS budget_fasls (
          id INT AUTO_INCREMENT PRIMARY KEY,
          bab_id INT NOT NULL,
          fasl_code VARCHAR(20) NOT NULL,
          name_ps VARCHAR(200) NOT NULL,
          name_fa VARCHAR(200) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          is_deleted TINYINT(1) DEFAULT 0,
          UNIQUE KEY uq_bab_fasl (bab_id, fasl_code),
          INDEX idx_fasl_code (fasl_code),
          INDEX idx_bab_id (bab_id),
          FOREIGN KEY (bab_id) REFERENCES budget_babs(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      // ── Seed standard Afghan government budget bab/fasl codes ─────────────
      const seedBabs = [
        { bab_code: '21', name_ps: 'معاشات او مزدونه',           name_fa: 'معاشات و مزدها',            description: 'د کارمندانو معاشات' },
        { bab_code: '22', name_ps: 'اجناس او خدمات',             name_fa: 'کالاها و خدمات',            description: 'د دفتري اجناسو او خدماتو لیاقت' },
        { bab_code: '23', name_ps: 'پانګه اچونه',                 name_fa: 'سرمایه‌گذاری',               description: 'د سامانه، فرنیچر او تجهیزاتو خریداری' },
        { bab_code: '24', name_ps: 'د پروژو مصارف',              name_fa: 'مصارف پروژه‌ها',             description: 'د پراختیایي پروژو لپاره مصارف' },
        { bab_code: '25', name_ps: 'نور مصارف',                  name_fa: 'سایر مصارف',                description: 'د پورتنیو بابونو له دایرې بهر مصارف' },
      ];
      for (const b of seedBabs) {
        await conn.query(
          `INSERT IGNORE INTO budget_babs (bab_code, name_ps, name_fa, description) VALUES (?, ?, ?, ?)`,
          [b.bab_code, b.name_ps, b.name_fa, b.description]
        ).catch(() => {});
      }

      const seedFasls = [
        // Bab 21 — Salaries
        { bab_code: '21', fasl_code: '2101', name_ps: 'اساسي معاشات',          name_fa: 'معاشات اساسی' },
        { bab_code: '21', fasl_code: '2102', name_ps: 'اضافه معاشات',           name_fa: 'حق‌الزحمه اضافی' },
        // Bab 22 — Goods & Services
        { bab_code: '22', fasl_code: '2201', name_ps: 'قرطاسیه او دفتري مواد', name_fa: 'قرطاسیه و لوازم دفتری' },
        { bab_code: '22', fasl_code: '2202', name_ps: 'کمپیوټري مواد',          name_fa: 'لوازم کامپیوتری' },
        { bab_code: '22', fasl_code: '2203', name_ps: 'د چاپ او خپرونې مصارف', name_fa: 'مصارف چاپ و نشر' },
        { bab_code: '22', fasl_code: '2204', name_ps: 'مخابراتي مصارف',         name_fa: 'مصارف مخابراتی' },
        { bab_code: '22', fasl_code: '2205', name_ps: 'د لارې مصارف',           name_fa: 'مصارف ترانسپورتی' },
        { bab_code: '22', fasl_code: '2206', name_ps: 'برق او اوبه',            name_fa: 'برق و آب' },
        { bab_code: '22', fasl_code: '2207', name_ps: 'د پاکولو مواد',          name_fa: 'مواد نظافتی' },
        { bab_code: '22', fasl_code: '2208', name_ps: 'د ماشین الاتو ساتنه',    name_fa: 'نگهداری ماشین‌آلات' },
        { bab_code: '22', fasl_code: '2209', name_ps: 'د دفتر کرایه',           name_fa: 'اجاره دفتر' },
        { bab_code: '22', fasl_code: '2210', name_ps: 'نور اجناس او خدمات',     name_fa: 'سایر کالاها و خدمات' },
        // Bab 23 — Capital
        { bab_code: '23', fasl_code: '2301', name_ps: 'فرنیچر او وسایل',        name_fa: 'مبلمان و لوازم' },
        { bab_code: '23', fasl_code: '2302', name_ps: 'کمپیوټر او تجهیزات',     name_fa: 'کامپیوتر و تجهیزات' },
        { bab_code: '23', fasl_code: '2303', name_ps: 'موټر او وسیله',           name_fa: 'وسایط نقلیه' },
        { bab_code: '23', fasl_code: '2304', name_ps: 'د ودانیو جوړول',          name_fa: 'ساخت و ساز' },
        // Bab 24 — Projects
        { bab_code: '24', fasl_code: '2401', name_ps: 'د پراختیا پروژه',        name_fa: 'پروژه توسعه‌ای' },
        // Bab 25 — Other
        { bab_code: '25', fasl_code: '2501', name_ps: 'نور مصارف',              name_fa: 'سایر مصارف' },
      ];
      for (const f of seedFasls) {
        try {
          const [babRows]: any = await conn.query(
            `SELECT id FROM budget_babs WHERE bab_code = ? AND is_deleted = 0 LIMIT 1`, [f.bab_code]);
          if (babRows[0]) {
            await conn.query(
              `INSERT IGNORE INTO budget_fasls (bab_id, fasl_code, name_ps, name_fa) VALUES (?, ?, ?, ?)`,
              [babRows[0].id, f.fasl_code, f.name_ps, f.name_fa]
            );
          }
        } catch { /* skip if already exists */ }
      }
      // ────────────────────────────────────────────────────────────────────

      const cols = [
        { table: 'items', col: 'bab_id', def: 'INT DEFAULT NULL' },
        { table: 'items', col: 'fasl_id', def: 'INT DEFAULT NULL' },
        { table: 'request_items', col: 'bab_id', def: 'INT DEFAULT NULL' },
        { table: 'request_items', col: 'fasl_id', def: 'INT DEFAULT NULL' },
      ];
      for (const c of cols) {
        const [rows]: any = await conn.query(
          `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
          [c.table, c.col]
        );
        if (rows[0].cnt === 0) {
          await conn.query(`ALTER TABLE \`${c.table}\` ADD COLUMN \`${c.col}\` ${c.def}`);
        }
      }
    } finally {
      conn.release();
    }
  }

  static async getBabs() {
    const [rows]: any = await pool.query(
      `SELECT id, bab_code, name_ps, name_fa, description FROM budget_babs WHERE is_deleted = 0 ORDER BY bab_code ASC`
    );
    return rows;
  }

  static async getBabById(id: number) {
    const [rows]: any = await pool.query(
      `SELECT id, bab_code, name_ps, name_fa, description FROM budget_babs WHERE id = ? AND is_deleted = 0`,
      [id]
    );
    return rows[0] || null;
  }

  static async getFaslsByBab(babId: number) {
    const [rows]: any = await pool.query(
      `SELECT id, bab_id, fasl_code, name_ps, name_fa, description FROM budget_fasls WHERE bab_id = ? AND is_deleted = 0 ORDER BY fasl_code ASC`,
      [babId]
    );
    return rows;
  }

  static async getAllFasls() {
    const [rows]: any = await pool.query(
      `SELECT f.id, f.bab_id, f.fasl_code, f.name_ps, f.name_fa, b.bab_code, b.name_ps as bab_name_ps
       FROM budget_fasls f JOIN budget_babs b ON f.bab_id = b.id
       WHERE f.is_deleted = 0 AND b.is_deleted = 0
       ORDER BY b.bab_code ASC, f.fasl_code ASC`
    );
    return rows;
  }

  static async search(q: string) {
    const like = `%${q}%`;
    const [babs]: any = await pool.query(
      `SELECT id, bab_code, name_ps, name_fa FROM budget_babs WHERE is_deleted = 0 AND (bab_code LIKE ? OR name_ps LIKE ? OR name_fa LIKE ?) ORDER BY bab_code LIMIT 20`,
      [like, like, like]
    );
    const [fasls]: any = await pool.query(
      `SELECT f.id, f.bab_id, f.fasl_code, f.name_ps, f.name_fa, b.bab_code FROM budget_fasls f
       JOIN budget_babs b ON f.bab_id = b.id
       WHERE f.is_deleted = 0 AND (f.fasl_code LIKE ? OR f.name_ps LIKE ? OR f.name_fa LIKE ? OR b.bab_code LIKE ?)
       ORDER BY b.bab_code, f.fasl_code LIMIT 30`,
      [like, like, like, like]
    );
    return { babs, fasls };
  }

  static async importBabFasl(babs: any[], fasls: any[]) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      let babsInserted = 0, babsSkipped = 0, faslsInserted = 0, faslsSkipped = 0;
      for (const b of babs) {
        const [res]: any = await conn.query(
          `INSERT IGNORE INTO budget_babs (bab_code, name_ps, name_fa, description) VALUES (?, ?, ?, ?)`,
          [b.bab_code, b.name_ps, b.name_fa, b.description || null]
        );
        if (res.affectedRows > 0) babsInserted++; else babsSkipped++;
      }
      for (const f of fasls) {
        const [babRows]: any = await conn.query(
          `SELECT id FROM budget_babs WHERE bab_code = ? AND is_deleted = 0 LIMIT 1`,
          [f.bab_code]
        );
        if (!babRows[0]) { faslsSkipped++; continue; }
        const [res]: any = await conn.query(
          `INSERT IGNORE INTO budget_fasls (bab_id, fasl_code, name_ps, name_fa, description) VALUES (?, ?, ?, ?, ?)`,
          [babRows[0].id, f.fasl_code, f.name_ps, f.name_fa, f.description || null]
        );
        if (res.affectedRows > 0) faslsInserted++; else faslsSkipped++;
      }
      await conn.commit();
      return { babsInserted, babsSkipped, faslsInserted, faslsSkipped };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }
}
