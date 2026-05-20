import { Request, Response } from 'express';
import { InventoryService } from '../services/inventory.service';

const handleError = (res: Response, error: any) => {
  console.error(error);
  if (error.message === 'item_code_exists') {
    return res.status(400).json({ success: false, message: 'د جنس کوډ مخکې شتون لري. مهرباني وکړئ بل کوډ وټاکئ.' });
  }
  if (error.message === 'not_found') {
    return res.status(404).json({ success: false, message: 'جنس ونه موندل شو.' });
  }
  if (error.message === 'invalid_quantity') {
    return res.status(400).json({ success: false, message: 'مقدار باید له صفر څخه زیات وي.' });
  }
  if (error.message === 'insufficient_stock') {
    return res.status(400).json({ success: false, message: 'په ګدام کې موجودي کمه ده.' });
  }
  return res.status(500).json({ success: false, message: 'تخنیکي ستونزه رامنځته شوه.', error: error.message });
};

export const getItems = async (req: Request, res: Response) => {
  try {
    const items = await InventoryService.getItems(req.query);
    res.json({ success: true, data: items });
  } catch (error) {
    handleError(res, error);
  }
};

export const getItemById = async (req: Request, res: Response): Promise<any> => {
  try {
    const item = await InventoryService.getItemById(Number(req.params.id));
    if (!item) return res.status(404).json({ success: false, message: 'جنس ونه موندل شو.' });
    res.json({ success: true, data: item });
  } catch (error) {
    handleError(res, error);
  }
};

export const createItem = async (req: Request, res: Response): Promise<any> => {
  try {
    const { item_code, name_ps, name_fa, category_id, unit_id, warehouse_id } = req.body;
    if (!item_code || !name_ps || !name_fa || !category_id || !unit_id || !warehouse_id) {
      return res.status(400).json({ success: false, message: 'ټول اړین معلومات باید ولیکل شي.' });
    }
    const userId = 1; // Defaulting to 1 for now until auth is fully integrated
    const id = await InventoryService.createItem(req.body, userId);
    res.status(201).json({ success: true, message: 'جنس په بریالیتوب سره ثبت شو.', data: { id } });
  } catch (error) {
    handleError(res, error);
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const userId = 1;
    await InventoryService.updateItem(Number(req.params.id), req.body, userId);
    res.json({ success: true, message: 'د جنس معلومات په بریالیتوب سره نوي شول.' });
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  try {
    const userId = 1;
    await InventoryService.deleteItem(Number(req.params.id), userId);
    res.json({ success: true, message: 'جنس په بریالیتوب سره ړنګ شو.' });
  } catch (error) {
    handleError(res, error);
  }
};

export const stockIn = async (req: Request, res: Response): Promise<any> => {
  try {
    const { item_id, quantity } = req.body;
    if (!item_id || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'د جنس ID او مقدار اړین دي.' });
    }
    const userId = 1;
    const result = await InventoryService.stockIn(req.body, userId);
    res.json({ success: true, message: 'موجودي په بریالیتوب سره زیاته شوه.', data: result });
  } catch (error) {
    handleError(res, error);
  }
};

export const stockOut = async (req: Request, res: Response): Promise<any> => {
  try {
    const { item_id, quantity } = req.body;
    if (!item_id || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'د جنس ID او مقدار اړین دي.' });
    }
    const userId = 1;
    const result = await InventoryService.stockOut(req.body, userId);
    res.json({ success: true, message: 'موجودي په بریالیتوب سره کمه شوه.', data: result });
  } catch (error) {
    handleError(res, error);
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await InventoryService.getTransactions(req.query);
    res.json({ success: true, data: transactions });
  } catch (error) {
    handleError(res, error);
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await InventoryService.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    handleError(res, error);
  }
};

export const getUnits = async (req: Request, res: Response) => {
  try {
    const units = await InventoryService.getUnits();
    res.json({ success: true, data: units });
  } catch (error) {
    handleError(res, error);
  }
};

export const getWarehouses = async (req: Request, res: Response) => {
  try {
    const warehouses = await InventoryService.getWarehouses();
    res.json({ success: true, data: warehouses });
  } catch (error) {
    handleError(res, error);
  }
};
