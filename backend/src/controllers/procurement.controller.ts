import { Request, Response } from 'express';
import { ProcurementService } from '../services/procurement.service';

const handleError = (res: Response, error: any) => {
  console.error(error);
  if (error.message === 'request_not_found') return res.status(404).json({ success: false, message: 'غوښتنه ونه موندل شوه.' });
  if (error.message === 'case_exists') return res.status(400).json({ success: false, message: 'د دې غوښتنې لپاره د تدارکاتو قضیه مخکې شتون لري.' });
  if (error.message === 'need_three_offers') return res.status(400).json({ success: false, message: 'لږترلږه ۳ نرخونو ته اړتیا ده.' });
  if (error.message === 'offer_not_found') return res.status(404).json({ success: false, message: 'نرخ ونه موندل شو.' });
  if (error.message === 'no_winner_selected') return res.status(400).json({ success: false, message: 'ګټونکی شرکت نه دی ټاکل شوی.' });
  
  return res.status(500).json({ success: false, message: 'تخنیکي ستونزه رامنځته شوه.', error: error.message });
};

export const getCases = async (req: Request, res: Response) => {
  try {
    const cases = await ProcurementService.getCases();
    res.json({ success: true, data: cases });
  } catch (error) {
    handleError(res, error);
  }
};

export const getCaseById = async (req: Request, res: Response): Promise<any> => {
  try {
    const pCase = await ProcurementService.getCaseById(Number(req.params.id));
    if (!pCase) return res.status(404).json({ success: false, message: 'د تدارکاتو قضیه ونه موندل شوه.' });
    res.json({ success: true, data: pCase });
  } catch (error) {
    handleError(res, error);
  }
};

export const createFromRequest = async (req: Request, res: Response) => {
  try {
    const userId = 1;
    const id = await ProcurementService.createFromRequest(Number(req.params.requestId), req.body.reason || '', userId);
    res.status(201).json({ success: true, message: 'د تدارکاتو قضیه پیل شوه.', data: { id } });
  } catch (error) {
    handleError(res, error);
  }
};

export const addVendorOffer = async (req: Request, res: Response): Promise<any> => {
  try {
    const { vendor_id, total_price } = req.body;
    if (!vendor_id || total_price === undefined) {
      return res.status(400).json({ success: false, message: 'د شرکت ID او مجموعي قیمت اړین دي.' });
    }
    const userId = 1;
    const id = await ProcurementService.addVendorOffer(Number(req.params.id), req.body, userId);
    res.status(201).json({ success: true, message: 'د شرکت نرخ ثبت شو.', data: { id } });
  } catch (error) {
    handleError(res, error);
  }
};

export const selectWinner = async (req: Request, res: Response) => {
  try {
    const userId = 1;
    await ProcurementService.selectWinner(Number(req.params.id), Number(req.params.offerId), userId);
    res.json({ success: true, message: 'ګټونکی شرکت وټاکل شو.' });
  } catch (error) {
    handleError(res, error);
  }
};

export const createPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const userId = 1;
    const id = await ProcurementService.createPurchaseOrder(Number(req.params.id), userId);
    res.status(201).json({ success: true, message: 'آمر خریداري (PO) جوړ شو.', data: { id } });
  } catch (error) {
    handleError(res, error);
  }
};
