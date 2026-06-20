import { Router, Request, Response } from 'express';
import { DelegationService } from '../services/delegation.service';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await DelegationService.getAll();
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/active', async (_req: Request, res: Response) => {
  try {
    const data = await DelegationService.getActiveDelegations();
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/check/:email', async (req: Request, res: Response) => {
  try {
    const result = await DelegationService.checkDelegation(String(req.params.email));
    res.json({ success: true, data: result });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { delegated_role, delegated_user_id, delegated_user_name, delegated_user_email,
            delegated_by_name, start_date, end_date, reason } = req.body;
    if (!delegated_role || !delegated_user_email || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'ټول اړین معلومات پوره کړئ.' });
    }
    const id = await DelegationService.create({
      delegated_role, delegated_user_id, delegated_user_name,
      delegated_user_email, delegated_by_name, start_date, end_date, reason
    });
    res.json({ success: true, id, message: 'کفیل بریالیتوب سره تعیین شو.' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/:id/deactivate', async (req: Request, res: Response) => {
  try {
    await DelegationService.deactivate(Number(req.params.id));
    res.json({ success: true, message: 'کفالت غیر فعال شو.' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await DelegationService.delete(Number(req.params.id));
    res.json({ success: true, message: 'کفالت حذف شو.' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
