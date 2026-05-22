import pool from '../config/db';

export interface CustomRole {
  id: number;
  name: string;
  name_ps: string;
  name_dr: string;
  permissions: string[];
  created_at: string;
}

export class CustomRolesService {
  static async runMigrations() {
    const { withRetry } = await import('../utils/migrationHelper');
    const conn = await pool.getConnection();
    try {
      await withRetry(() => conn.query(`
        CREATE TABLE IF NOT EXISTS custom_roles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          name_ps VARCHAR(200) NOT NULL DEFAULT '',
          name_dr VARCHAR(200) NOT NULL DEFAULT '',
          permissions JSON NOT NULL DEFAULT ('[]'),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
      `));
    } finally {
      conn.release();
    }
  }

  static async getAll(): Promise<CustomRole[]> {
    const [rows]: any = await pool.query(
      'SELECT id, name, name_ps, name_dr, permissions, created_at FROM custom_roles ORDER BY created_at ASC'
    );
    return rows.map((r: any) => ({
      ...r,
      permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : (r.permissions || []),
    }));
  }

  static async create(data: { name: string; name_ps: string; name_dr: string; permissions: string[] }): Promise<CustomRole> {
    const [result]: any = await pool.query(
      'INSERT INTO custom_roles (name, name_ps, name_dr, permissions) VALUES (?, ?, ?, ?)',
      [data.name, data.name_ps, data.name_dr, JSON.stringify(data.permissions)]
    );
    const [rows]: any = await pool.query('SELECT * FROM custom_roles WHERE id = ?', [result.insertId]);
    const r = rows[0];
    return { ...r, permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : r.permissions };
  }

  static async update(id: number, data: { name: string; name_ps: string; name_dr: string; permissions: string[] }): Promise<boolean> {
    const [result]: any = await pool.query(
      'UPDATE custom_roles SET name = ?, name_ps = ?, name_dr = ?, permissions = ? WHERE id = ?',
      [data.name, data.name_ps, data.name_dr, JSON.stringify(data.permissions), id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id: number): Promise<boolean> {
    const [result]: any = await pool.query('DELETE FROM custom_roles WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}
