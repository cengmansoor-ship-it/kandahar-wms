import { ResultSetHeader, RowDataPacket } from 'mysql2';
import db from '../config/db';

export class RequestService {
  static async getRequests() {
    const [rows] = await db.query(`
      SELECT r.*, u.name as requester_name, f.name_ps as faculty_name, d.name_ps as department_name, p.full_name as person_name
      FROM requests r
      LEFT JOIN users u ON r.requester_id = u.id
      LEFT JOIN faculties f ON r.faculty_id = f.id
      LEFT JOIN departments d ON r.department_id = d.id
      LEFT JOIN people p ON r.person_id = p.id
      WHERE r.is_deleted = FALSE
      ORDER BY r.created_at DESC
    `);
    return rows;
  }

  static async getRequestById(id: number) {
    const [requests] = await db.query<RowDataPacket[]>(`
      SELECT r.*, u.name as requester_name, f.name_ps as faculty_name, d.name_ps as department_name, p.full_name as person_name
      FROM requests r
      LEFT JOIN users u ON r.requester_id = u.id
      LEFT JOIN faculties f ON r.faculty_id = f.id
      LEFT JOIN departments d ON r.department_id = d.id
      LEFT JOIN people p ON r.person_id = p.id
      WHERE r.id = ? AND r.is_deleted = FALSE
    `, [id]);

    if (requests.length === 0) return null;

    const [items] = await db.query<RowDataPacket[]>(`
      SELECT ri.*, i.item_code, u.name_ps as unit_name
      FROM request_items ri
      LEFT JOIN items i ON ri.item_id = i.id
      LEFT JOIN units u ON ri.unit_id = u.id
      WHERE ri.request_id = ?
    `, [id]);

    return { ...requests[0], items };
  }

  static async createRequest(data: any, userId: number | null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const trackingId = 'REQ-' + Date.now();

      const [result] = await connection.query<ResultSetHeader>(`
        INSERT INTO requests (tracking_id, requester_id, faculty_id, department_id, person_id, request_level, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [trackingId, userId, data.faculty_id || null, data.department_id || null, data.person_id || null, data.request_level || 'NORMAL', data.notes || '']);

      const requestId = result.insertId;

      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          await connection.query(`
            INSERT INTO request_items (request_id, item_id, item_name, quantity, unit_id, specifications)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [requestId, item.item_id || null, item.item_name, item.quantity, item.unit_id || null, item.specifications || '']);
        }
      }

      await connection.query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
        VALUES (?, ?, ?, ?)
      `, [userId, 'CREATE', 'REQUEST', requestId]);

      await connection.commit();
      return requestId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async updateStatus(id: number, status: string, userId: number | null) {
    let progress = 0;
    switch(status) {
      case 'PENDING': progress = 0; break;
      case 'CONFIRMED': progress = 20; break;
      case 'SENT_TO_PROCUREMENT': progress = 40; break;
      case 'READY_FOR_DELIVERY': progress = 80; break;
      case 'DELIVERED': progress = 100; break;
      case 'COMPLETED': progress = 100; break;
      case 'REJECTED': progress = 0; break;
    }

    const [result] = await db.query<ResultSetHeader>(`
      UPDATE requests SET status = ?, progress_percent = ? WHERE id = ?
    `, [status, progress, id]);

    if (result.affectedRows === 0) throw new Error('not_found');

    await db.query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, 'UPDATE_STATUS', 'REQUEST', id, JSON.stringify({ status, progress_percent: progress })]);

    return true;
  }

  static async updateLevel(id: number, newLevel: string, reason: string, userId: number | null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [requests] = await connection.query<RowDataPacket[]>(`SELECT request_level FROM requests WHERE id = ?`, [id]);
      if (requests.length === 0) throw new Error('not_found');

      const oldLevel = requests[0].request_level;

      await connection.query(`UPDATE requests SET request_level = ? WHERE id = ?`, [newLevel, id]);

      await connection.query(`
        INSERT INTO request_level_history (request_id, old_level, new_level, changed_by, reason)
        VALUES (?, ?, ?, ?, ?)
      `, [id, oldLevel, newLevel, userId, reason]);

      await connection.query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
        VALUES (?, ?, ?, ?, ?)
      `, [userId, 'UPDATE_LEVEL', 'REQUEST', id, JSON.stringify({ new_level: newLevel })]);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getLevelHistory(id: number) {
    const [rows] = await db.query<RowDataPacket[]>(`
      SELECT h.*, u.name as changed_by_name
      FROM request_level_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.request_id = ?
      ORDER BY h.created_at DESC
    `, [id]);
    return rows;
  }

  static async getPipelineHistory(id: number) {
    const [request] = await db.query<RowDataPacket[]>(`
      SELECT r.tracking_id, r.status, r.progress_percent, r.request_level,
        r.created_at, r.updated_at
      FROM requests r
      WHERE r.id = ? AND r.is_deleted = FALSE
    `, [id]);

    if (request.length === 0) throw new Error('not_found');

    const [auditLogs] = await db.query<RowDataPacket[]>(`
      SELECT al.action, al.new_value, al.created_at
      FROM audit_logs al
      WHERE al.entity_type = 'REQUEST' AND al.entity_id = ?
      ORDER BY al.created_at ASC
    `, [id.toString()]);

    const [levelHistory] = await db.query<RowDataPacket[]>(`
      SELECT h.*, u.name as changed_by_name
      FROM request_level_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.request_id = ?
      ORDER BY h.created_at ASC
    `, [id]);

    return {
      request: request[0],
      audit_trail: auditLogs,
      level_history: levelHistory
    };
  }

  static async deleteRequest(id: number, userId: number | null) {
    const [result] = await db.query<ResultSetHeader>(`UPDATE requests SET is_deleted = TRUE WHERE id = ?`, [id]);
    if (result.affectedRows === 0) throw new Error('not_found');

    await db.query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
      VALUES (?, ?, ?, ?)
    `, [userId, 'DELETE', 'REQUEST', id]);

    return true;
  }
}
