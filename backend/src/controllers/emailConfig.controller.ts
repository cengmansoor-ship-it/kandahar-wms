import { Request, Response } from 'express';
import { EmailConfigService } from '../services/emailConfig.service';

export const getEmailConfigs = async (req: Request, res: Response) => {
  try {
    const configs = await EmailConfigService.getAll();
    return res.json({ success: true, data: configs });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createEmailConfig = async (req: Request, res: Response) => {
  const { email, app_password, label } = req.body;
  if (!email || !app_password) {
    return res.status(400).json({ success: false, message: 'Email and app password are required' });
  }
  if (app_password.length !== 16) {
    return res.status(400).json({ success: false, message: 'App password must be exactly 16 characters' });
  }
  try {
    const config = await EmailConfigService.create(email, app_password, label || '');
    return res.json({ success: true, data: config });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateEmailConfig = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { email, app_password, label } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  if (app_password && app_password.trim() !== '' && app_password.length !== 16) {
    return res.status(400).json({ success: false, message: 'App password must be exactly 16 characters' });
  }
  try {
    const ok = await EmailConfigService.update(id, email, app_password || '', label || '');
    if (!ok) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteEmailConfig = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const ok = await EmailConfigService.delete(id);
    if (!ok) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
