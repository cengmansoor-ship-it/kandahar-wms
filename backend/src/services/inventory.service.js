"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const mysql2_1 = require("mysql2");
const db_1 = __importDefault(require("../config/db"));
class InventoryService {
    static async getItems(filters) {
        let query = `
      SELECT i.*, 
        c.name_ps as category_name, 
        u.name_ps as unit_name, 
        w.name_ps as warehouse_name 
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN units u ON i.unit_id = u.id
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      WHERE i.is_deleted = FALSE
    `;
        const params = [];
        if (filters.search) {
            query += ` AND (i.name_ps LIKE ? OR i.name_fa LIKE ? OR i.item_code LIKE ?)`;
            params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
        }
        if (filters.category_id) {
            query += ` AND i.category_id = ?`;
            params.push(filters.category_id);
        }
        if (filters.warehouse_id) {
            query += ` AND i.warehouse_id = ?`;
            params.push(filters.warehouse_id);
        }
        if (filters.lowStock === 'true') {
            query += ` AND i.current_stock <= i.minimum_stock`;
        }
        query += ` ORDER BY i.created_at DESC`;
        const [rows] = await db_1.default.query(query, params);
        return rows;
    }
    static async getItemById(id) {
        const [rows] = await db_1.default.query(`
      SELECT i.*, 
        c.name_ps as category_name, 
        u.name_ps as unit_name, 
        w.name_ps as warehouse_name 
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN units u ON i.unit_id = u.id
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      WHERE i.id = ? AND i.is_deleted = FALSE
    `, [id]);
        return rows[0];
    }
    static async createItem(data, userId) {
        const connection = await db_1.default.getConnection();
        try {
            await connection.beginTransaction();
            const [existing] = await connection.query(`SELECT id FROM items WHERE item_code = ?`, [data.item_code]);
            if (existing.length > 0) {
                throw new Error('item_code_exists');
            }
            const [result] = await connection.query(`
        INSERT INTO items (item_code, name_ps, name_fa, description, category_id, unit_id, warehouse_id, minimum_stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                data.item_code, data.name_ps, data.name_fa, data.description || '',
                data.category_id, data.unit_id, data.warehouse_id, data.minimum_stock || 0
            ]);
            const newItemId = result.insertId;
            await connection.query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
        VALUES (?, ?, ?, ?, ?)
      `, [userId, 'CREATE', 'ITEM', newItemId, JSON.stringify(data)]);
            await connection.commit();
            return newItemId;
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    static async updateItem(id, data, userId) {
        const connection = await db_1.default.getConnection();
        try {
            await connection.beginTransaction();
            const [oldItems] = await connection.query(`SELECT * FROM items WHERE id = ? AND is_deleted = FALSE`, [id]);
            if (oldItems.length === 0)
                throw new Error('not_found');
            const oldItem = oldItems[0];
            const updateFields = [];
            const params = [];
            const allowedFields = ['name_ps', 'name_fa', 'description', 'category_id', 'unit_id', 'warehouse_id', 'minimum_stock'];
            for (const [key, value] of Object.entries(data)) {
                if (allowedFields.includes(key) && value !== undefined) {
                    updateFields.push(`${key} = ?`);
                    params.push(value);
                }
            }
            if (updateFields.length > 0) {
                params.push(id);
                await connection.query(`UPDATE items SET ${updateFields.join(', ')} WHERE id = ?`, params);
                await connection.query(`
          INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [userId, 'UPDATE', 'ITEM', id, JSON.stringify(oldItem), JSON.stringify(data)]);
            }
            await connection.commit();
            return true;
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    static async deleteItem(id, userId) {
        const connection = await db_1.default.getConnection();
        try {
            await connection.beginTransaction();
            const [result] = await connection.query(`UPDATE items SET is_deleted = TRUE WHERE id = ?`, [id]);
            if (result.affectedRows === 0)
                throw new Error('not_found');
            await connection.query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
        VALUES (?, ?, ?, ?)
      `, [userId, 'DELETE', 'ITEM', id]);
            await connection.commit();
            return true;
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    static async stockIn(data, userId) {
        if (data.quantity <= 0)
            throw new Error('invalid_quantity');
        const connection = await db_1.default.getConnection();
        try {
            await connection.beginTransaction();
            const [items] = await connection.query(`SELECT current_stock FROM items WHERE id = ? AND is_deleted = FALSE FOR UPDATE`, [data.item_id]);
            if (items.length === 0)
                throw new Error('not_found');
            const prevStock = items[0].current_stock;
            const newStock = prevStock + data.quantity;
            await connection.query(`UPDATE items SET current_stock = ? WHERE id = ?`, [newStock, data.item_id]);
            const [txResult] = await connection.query(`
        INSERT INTO stock_transactions (item_id, transaction_type, quantity, previous_stock, new_stock, source_type, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [data.item_id, 'IN', data.quantity, prevStock, newStock, data.source_type || null, data.notes || null, userId]);
            await connection.query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
        VALUES (?, ?, ?, ?, ?)
      `, [userId, 'STOCK_IN', 'TRANSACTION', txResult.insertId, JSON.stringify({ item_id: data.item_id, quantity: data.quantity })]);
            await connection.commit();
            return { previous_stock: prevStock, new_stock: newStock };
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    static async stockOut(data, userId) {
        if (data.quantity <= 0)
            throw new Error('invalid_quantity');
        const connection = await db_1.default.getConnection();
        try {
            await connection.beginTransaction();
            const [items] = await connection.query(`SELECT current_stock FROM items WHERE id = ? AND is_deleted = FALSE FOR UPDATE`, [data.item_id]);
            if (items.length === 0)
                throw new Error('not_found');
            const prevStock = items[0].current_stock;
            if (prevStock < data.quantity)
                throw new Error('insufficient_stock');
            const newStock = prevStock - data.quantity;
            await connection.query(`UPDATE items SET current_stock = ? WHERE id = ?`, [newStock, data.item_id]);
            const [txResult] = await connection.query(`
        INSERT INTO stock_transactions (item_id, transaction_type, quantity, previous_stock, new_stock, source_type, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [data.item_id, 'OUT', data.quantity, prevStock, newStock, data.source_type || null, data.notes || null, userId]);
            await connection.query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
        VALUES (?, ?, ?, ?, ?)
      `, [userId, 'STOCK_OUT', 'TRANSACTION', txResult.insertId, JSON.stringify({ item_id: data.item_id, quantity: data.quantity })]);
            await connection.commit();
            return { previous_stock: prevStock, new_stock: newStock };
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    static async getTransactions(filters) {
        let query = `
      SELECT t.*, i.name_ps as item_name 
      FROM stock_transactions t
      LEFT JOIN items i ON t.item_id = i.id
      WHERE 1=1
    `;
        const params = [];
        if (filters.item_id) {
            query += ` AND t.item_id = ?`;
            params.push(filters.item_id);
        }
        if (filters.transaction_type) {
            query += ` AND t.transaction_type = ?`;
            params.push(filters.transaction_type);
        }
        query += ` ORDER BY t.created_at DESC LIMIT 100`;
        const [rows] = await db_1.default.query(query, params);
        return rows;
    }
    static async getCategories() {
        const [rows] = await db_1.default.query(`SELECT * FROM categories WHERE is_deleted = FALSE ORDER BY name_ps ASC`);
        return rows;
    }
    static async getUnits() {
        const [rows] = await db_1.default.query(`SELECT * FROM units WHERE is_deleted = FALSE ORDER BY name_ps ASC`);
        return rows;
    }
    static async getWarehouses() {
        const [rows] = await db_1.default.query(`SELECT * FROM warehouses WHERE is_deleted = FALSE ORDER BY name_ps ASC`);
        return rows;
    }
}
exports.InventoryService = InventoryService;
//# sourceMappingURL=inventory.service.js.map