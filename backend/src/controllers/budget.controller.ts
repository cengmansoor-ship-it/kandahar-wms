import { Request, Response } from 'express';
import { BudgetService } from '../services/budget.service';

export const getBabs = async (req: Request, res: Response) => {
  try {
    const data = await BudgetService.getBabs();
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const getBabById = async (req: Request, res: Response) => {
  try {
    const data = await BudgetService.getBabById(Number(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: 'باب ونه موندل شو' });
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const getFaslsByBab = async (req: Request, res: Response) => {
  try {
    const data = await BudgetService.getFaslsByBab(Number(req.params.id));
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const getAllFasls = async (req: Request, res: Response) => {
  try {
    const data = await BudgetService.getAllFasls();
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const searchBudget = async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ success: true, data: { babs: [], fasls: [] } });
    const data = await BudgetService.search(q);
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const importBabFasl = async (req: Request, res: Response) => {
  try {
    const { babs = [], fasls = [] } = req.body;
    if (!Array.isArray(babs) || !Array.isArray(fasls)) {
      return res.status(400).json({ success: false, message: 'د بابونو او فصلونو لیست اړین دی' });
    }
    const result = await BudgetService.importBabFasl(babs, fasls);
    return res.json({ success: true, data: result });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};
