import { Request, Response } from 'express';
import { TrashService } from '../services/trash.service';

export const getAll = async (req: Request, res: Response) => {
  try {
    const data = await TrashService.getAll();
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const restore = async (req: Request, res: Response) => {
  try {
    const table = req.params.table as string;
    const id = req.params.id as string;
    await TrashService.restore(table, parseInt(id));
    res.json({ success: true });
  } catch (e: any) {
    const status = ['invalid_table', 'not_found'].includes(e.message) ? 400 : 500;
    res.status(status).json({ success: false, message: e.message });
  }
};

export const permanentDelete = async (req: Request, res: Response) => {
  try {
    const table = req.params.table as string;
    const id = req.params.id as string;
    await TrashService.permanentDelete(table, parseInt(id));
    res.json({ success: true });
  } catch (e: any) {
    const status = ['invalid_table', 'not_found'].includes(e.message) ? 400 : 500;
    res.status(status).json({ success: false, message: e.message });
  }
};

export const purge = async (req: Request, res: Response) => {
  try {
    const purged = await TrashService.purgeExpired(30);
    res.json({ success: true, purged });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};
