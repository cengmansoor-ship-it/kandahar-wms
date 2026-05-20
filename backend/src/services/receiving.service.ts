import { ResultSetHeader, RowDataPacket } from 'mysql2';
import db from '../config/db';

export class ReceivingService {
  static async getRecords() {
    const [rows] = await db.query(`
      SELECT rr.*, po.po_number, r.tracking_id as request_tracking_id
      FROM receiving_records rr
      LEFT JOIN purchase_orders po ON rr.purchase_order_id = po.id
      LEFT JOIN requests r ON rr.request_id = r.id
      WHERE rr.is_deleted = FALSE
      ORDER BY rr.created_at DESC
    `);
    return rows;
  }

  static async getRecordById(id: number) {
    const [records] = await db.query<RowDataPacket[]>(`
      SELECT rr.*, po.po_number, r.tracking_id as request_tracking_id
      FROM receiving_records rr
      LEFT JOIN purchase_orders po ON rr.purchase_order_id = po.id
      LEFT JOIN requests r ON rr.request_id = r.id
      WHERE rr.id = ? AND rr.is_deleted = FALSE
    `, [id]);

    if (records.length === 0) return null;

    const [items] = await db.query<RowDataPacket[]>(`
      SELECT ri.*, i.name_ps as item_name, u.name_ps as unit_name
      FROM receiving_items ri
      LEFT JOIN items i ON ri.item_id = i.id
      LEFT JOIN units u ON ri.unit_id = u.id
      WHERE ri.receiving_record_id = ?
    `, [id]);

    return { ...records[0], items };
  }

  static async createFromPurchaseOrder(purchaseOrderId: number, notes: string, userId: number | null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [pos] = await db.query<RowDataPacket[]>(`
        SELECT procurement_case_id FROM purchase_orders WHERE id = ? AND is_deleted = FALSE
      `, [purchaseOrderId]);
      
      if (pos.length === 0) throw new Error('po_not_found');

      const procCaseId = pos[0].procurement_case_id;

      const [cases] = await db.query<RowDataPacket[]>(`SELECT request_id FROM procurement_cases WHERE id = ?`, [procCaseId]);
      const requestId = cases[0]?.request_id || null;

      const [result] = await connection.query<ResultSetHeader>(`
        INSERT INTO receiving_records (purchase_order_id, request_id, received_by, notes)
        VALUES (?, ?, ?, ?)
      `, [purchaseOrderId, requestId, userId, notes]);

      await connection.query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
        VALUES (?, ?, ?, ?)
      `, [userId, 'CREATE', 'RECEIVING_RECORD', result.insertId]);

      if (requestId) {
        await connection.query(`UPDATE requests SET status = 'READY_FOR_DELIVERY', progress_percent = 80 WHERE id = ?`, [requestId]);
      }

      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async addReceivingItems(recordId: number, items: any[], userId: number | null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      for (const item of items) {
        if (!item.item_id || !item.quantity_received) continue;

        // Add to receiving items
        await connection.query(`
          INSERT INTO receiving_items (receiving_record_id, item_id, quantity_received, unit_id, notes)
          VALUES (?, ?, ?, ?, ?)
        `, [recordId, item.item_id, item.quantity_received, item.unit_id || null, item.notes || '']);

        // Update Stock
        const [stockRows] = await connection.query<RowDataPacket[]>(`SELECT current_stock FROM items WHERE id = ? FOR UPDATE`, [item.item_id]);
        if (stockRows.length > 0) {
          const prevStock = stockRows[0].current_stock;
          const newStock = prevStock + item.quantity_received;

          await connection.query(`UPDATE items SET current_stock = ? WHERE id = ?`, [newStock, item.item_id]);

          await connection.query(`
            INSERT INTO stock_transactions (item_id, transaction_type, quantity, previous_stock, new_stock, source_type, reference_id, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [item.item_id, 'IN', item.quantity_received, prevStock, newStock, 'RECEIVING', recordId.toString(), userId]);
        }
      }

      await connection.query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
        VALUES (?, ?, ?, ?)
      `, [userId, 'ADD_ITEMS', 'RECEIVING_RECORD', recordId]);

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
