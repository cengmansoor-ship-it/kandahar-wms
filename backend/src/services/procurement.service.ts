import { ResultSetHeader, RowDataPacket } from 'mysql2';
import db from '../config/db';

export class ProcurementService {
  static async getCases() {
    const [rows] = await db.query(`
      SELECT p.*, r.tracking_id as request_tracking_id
      FROM procurement_cases p
      LEFT JOIN requests r ON p.request_id = r.id
      WHERE p.is_deleted = FALSE
      ORDER BY p.created_at DESC
    `);
    return rows;
  }

  static async getCaseById(id: number) {
    const [cases] = await db.query<RowDataPacket[]>(`
      SELECT p.*, r.tracking_id as request_tracking_id
      FROM procurement_cases p
      LEFT JOIN requests r ON p.request_id = r.id
      WHERE p.id = ? AND p.is_deleted = FALSE
    `, [id]);

    if (cases.length === 0) return null;

    const [offers] = await db.query<RowDataPacket[]>(`
      SELECT o.*, v.name as vendor_name
      FROM vendor_offers o
      LEFT JOIN vendors v ON o.vendor_id = v.id
      WHERE o.procurement_case_id = ?
    `, [id]);

    const [po] = await db.query<RowDataPacket[]>(`
      SELECT po.*, v.name as vendor_name
      FROM purchase_orders po
      LEFT JOIN vendors v ON po.vendor_id = v.id
      WHERE po.procurement_case_id = ? AND po.is_deleted = FALSE
    `, [id]);

    return { ...cases[0], offers, purchase_order: po[0] || null };
  }

  static async createFromRequest(requestId: number, reason: string, userId: number | null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [reqs] = await connection.query<RowDataPacket[]>(`SELECT id FROM requests WHERE id = ? AND is_deleted = FALSE`, [requestId]);
      if (reqs.length === 0) throw new Error('request_not_found');

      const [existing] = await connection.query<RowDataPacket[]>(`SELECT id FROM procurement_cases WHERE request_id = ? AND is_deleted = FALSE`, [requestId]);
      if (existing.length > 0) throw new Error('case_exists');

      const [result] = await connection.query<ResultSetHeader>(`
        INSERT INTO procurement_cases (request_id, reason)
        VALUES (?, ?)
      `, [requestId, reason]);

      const caseId = result.insertId;

      await connection.query(`UPDATE requests SET status = 'SENT_TO_PROCUREMENT', progress_percent = 40 WHERE id = ?`, [requestId]);

      await connection.query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
        VALUES (?, ?, ?, ?)
      `, [userId, 'CREATE', 'PROCUREMENT_CASE', caseId]);

      await connection.commit();
      return caseId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async addVendorOffer(caseId: number, data: any, userId: number | null) {
    const [result] = await db.query<ResultSetHeader>(`
      INSERT INTO vendor_offers (procurement_case_id, vendor_id, total_price, currency, details_json)
      VALUES (?, ?, ?, ?, ?)
    `, [caseId, data.vendor_id, data.total_price, data.currency || 'AFN', JSON.stringify(data.details || {})]);

    await db.query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, 'ADD_OFFER', 'PROCUREMENT_CASE', caseId, JSON.stringify(data)]);

    return result.insertId;
  }

  static async selectWinner(caseId: number, offerId: number, userId: number | null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [offers] = await connection.query<RowDataPacket[]>(`SELECT id FROM vendor_offers WHERE procurement_case_id = ?`, [caseId]);
      if (offers.length < 3) throw new Error('need_three_offers');

      const offerExists = offers.some(o => o.id === offerId);
      if (!offerExists) throw new Error('offer_not_found');

      await connection.query(`UPDATE vendor_offers SET is_winner = FALSE WHERE procurement_case_id = ?`, [caseId]);
      await connection.query(`UPDATE vendor_offers SET is_winner = TRUE WHERE id = ?`, [offerId]);
      
      await connection.query(`UPDATE procurement_cases SET status = 'WINNER_SELECTED' WHERE id = ?`, [caseId]);

      await connection.query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
        VALUES (?, ?, ?, ?, ?)
      `, [userId, 'SELECT_WINNER', 'PROCUREMENT_CASE', caseId, JSON.stringify({ winner_offer_id: offerId })]);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async createPurchaseOrder(caseId: number, userId: number | null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [winners] = await connection.query<RowDataPacket[]>(`
        SELECT vendor_id, total_price FROM vendor_offers 
        WHERE procurement_case_id = ? AND is_winner = TRUE
      `, [caseId]);
      if (winners.length === 0) throw new Error('no_winner_selected');

      const winner = winners[0];
      const poNumber = 'PO-' + Date.now();

      const [result] = await connection.query<ResultSetHeader>(`
        INSERT INTO purchase_orders (procurement_case_id, vendor_id, po_number, total_amount)
        VALUES (?, ?, ?, ?)
      `, [caseId, winner.vendor_id, poNumber, winner.total_price]);

      await connection.query(`UPDATE procurement_cases SET status = 'PO_CREATED' WHERE id = ?`, [caseId]);

      await connection.query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
        VALUES (?, ?, ?, ?, ?)
      `, [userId, 'CREATE', 'PURCHASE_ORDER', result.insertId, JSON.stringify({ po_number: poNumber })]);

      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
