import { ResultSetHeader, RowDataPacket } from 'mysql2';
import db from '../config/db';

export class DeliveryService {
  static async getDeliveries() {
    const [rows] = await db.query(`
      SELECT d.*, r.tracking_id as request_tracking_id, p.full_name as delivered_to_name
      FROM deliveries d
      LEFT JOIN requests r ON d.request_id = r.id
      LEFT JOIN people p ON d.delivered_to_person_id = p.id
      WHERE d.is_deleted = FALSE
      ORDER BY d.created_at DESC
    `);
    return rows;
  }

  static async getDeliveryById(id: number) {
    const [deliveries] = await db.query<RowDataPacket[]>(`
      SELECT d.*, r.tracking_id as request_tracking_id, p.full_name as delivered_to_name
      FROM deliveries d
      LEFT JOIN requests r ON d.request_id = r.id
      LEFT JOIN people p ON d.delivered_to_person_id = p.id
      WHERE d.id = ? AND d.is_deleted = FALSE
    `, [id]);

    if (deliveries.length === 0) return null;

    const [items] = await db.query<RowDataPacket[]>(`
      SELECT di.*, i.name_ps as item_name, u.name_ps as unit_name
      FROM delivery_items di
      LEFT JOIN items i ON di.item_id = i.id
      LEFT JOIN units u ON di.unit_id = u.id
      WHERE di.delivery_id = ?
    `, [id]);

    return { ...deliveries[0], items };
  }

  static async createFromRequest(requestId: number, data: any, userId: number | null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [reqs] = await db.query<RowDataPacket[]>(`SELECT id, person_id FROM requests WHERE id = ? AND is_deleted = FALSE`, [requestId]);
      if (reqs.length === 0) throw new Error('request_not_found');

      const personId = data.delivered_to_person_id || reqs[0].person_id || null;

      const [result] = await connection.query<ResultSetHeader>(`
        INSERT INTO deliveries (request_id, delivered_to_person_id, delivered_by, fs5_number, notes)
        VALUES (?, ?, ?, ?, ?)
      `, [requestId, personId, userId, data.fs5_number || null, data.notes || '']);

      await connection.query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
        VALUES (?, ?, ?, ?)
      `, [userId, 'CREATE', 'DELIVERY', result.insertId]);

      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async addDeliveryItems(deliveryId: number, items: any[], userId: number | null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [deliveries] = await connection.query<RowDataPacket[]>(`
        SELECT request_id, delivered_to_person_id FROM deliveries WHERE id = ?
      `, [deliveryId]);
      if (deliveries.length === 0) throw new Error('delivery_not_found');
      
      const reqId = deliveries[0].request_id;
      const personId = deliveries[0].delivered_to_person_id;

      let deptId = null;
      let facId = null;

      if (personId) {
        const [persons] = await connection.query<RowDataPacket[]>(`
          SELECT p.department_id, d.faculty_id FROM people p 
          LEFT JOIN departments d ON p.department_id = d.id 
          WHERE p.id = ?
        `, [personId]);
        if (persons.length > 0) {
          deptId = persons[0].department_id;
          facId = persons[0].faculty_id;
        }
      }

      for (const item of items) {
        if (!item.item_id || !item.quantity) continue;

        const [stockRows] = await connection.query<RowDataPacket[]>(`SELECT current_stock FROM items WHERE id = ? FOR UPDATE`, [item.item_id]);
        if (stockRows.length === 0) throw new Error(`item_not_found: ${item.item_id}`);
        
        const prevStock = stockRows[0].current_stock;
        if (prevStock < item.quantity) throw new Error(`insufficient_stock_for_item: ${item.item_id}`);

        const newStock = prevStock - item.quantity;

        // Add to delivery items
        await connection.query(`
          INSERT INTO delivery_items (delivery_id, item_id, quantity, unit_id, notes)
          VALUES (?, ?, ?, ?, ?)
        `, [deliveryId, item.item_id, item.quantity, item.unit_id || null, item.notes || '']);

        // Update Stock
        await connection.query(`UPDATE items SET current_stock = ? WHERE id = ?`, [newStock, item.item_id]);

        // Stock Transaction OUT
        await connection.query(`
          INSERT INTO stock_transactions (item_id, transaction_type, quantity, previous_stock, new_stock, source_type, reference_id, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [item.item_id, 'OUT', item.quantity, prevStock, newStock, 'DELIVERY_FS5', deliveryId.toString(), userId]);

        // Item Assignment
        await connection.query(`
          INSERT INTO item_assignments (item_id, person_id, department_id, faculty_id, quantity, source_type, source_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [item.item_id, personId, deptId, facId, item.quantity, 'DELIVERY', deliveryId]);
      }

      if (reqId) {
        await connection.query(`UPDATE requests SET status = 'DELIVERED', progress_percent = 100 WHERE id = ?`, [reqId]);
      }

      await connection.query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
        VALUES (?, ?, ?, ?)
      `, [userId, 'ADD_ITEMS', 'DELIVERY', deliveryId]);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
