import { Request, Response } from 'express';
import { ReceivingService } from '../services/receiving.service';
import { SmsService } from '../services/sms.service';

const handleError = (res: Response, error: any) => {
  console.error(error);
  if (error.message === 'po_not_found') return res.status(404).json({ success: false, message: 'آمر خریداري ونه موندل شو.' });
  if (error.message === 'request_not_found') return res.status(404).json({ success: false, message: 'غوښتنه ونه موندل شوه.' });
  return res.status(500).json({ success: false, message: 'تخنیکي ستونزه رامنځته شوه.', error: error.message });
};

export const getRecords = async (req: Request, res: Response) => {
  try {
    const records = await ReceivingService.getRecords();
    res.json({ success: true, data: records });
  } catch (error) {
    handleError(res, error);
  }
};

export const getRecordById = async (req: Request, res: Response): Promise<any> => {
  try {
    const record = await ReceivingService.getRecordById(Number(req.params.id));
    if (!record) return res.status(404).json({ success: false, message: 'د رسیداتو ریکارډ ونه موندل شو.' });
    res.json({ success: true, data: record });
  } catch (error) {
    handleError(res, error);
  }
};

export const createFromRequest = async (req: Request, res: Response) => {
  try {
    const userId = 1;
    const id = await ReceivingService.createFromRequest(Number(req.params.requestId), req.body.notes || '', userId);
    res.status(201).json({ success: true, message: 'د رسیداتو فورم جوړ شو.', data: { id } });
  } catch (error) {
    handleError(res, error);
  }
};

export const createFromPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const userId = 1;
    const id = await ReceivingService.createFromPurchaseOrder(Number(req.params.purchaseOrderId), req.body.notes || '', userId);
    res.status(201).json({ success: true, message: 'د رسیداتو فورم جوړ شو.', data: { id } });
  } catch (error) {
    handleError(res, error);
  }
};

export const addReceivingItems = async (req: Request, res: Response): Promise<any> => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'اجناس ندي داخل شوي.' });
    }
    const userId = 1;
    await ReceivingService.addReceivingItems(Number(req.params.id), items, userId);

    // Fire-and-forget SMS — never block the response
    SmsService.sendIfEnabled(
      'received',
      `✅ کندهار پوهنتون WMS\n${items.length} ډول اجناس ګدام ته داخل شول.\nرسید شمیره: ${req.params.id}`
    ).catch(() => {});

    // Fire-and-forget budget utilization check after receiving
    SmsService.checkBudgetUtilization().catch(() => {});

    res.json({ success: true, message: 'اجناس په بریالیتوب سره رسید او ګدام ته اضافه شول.' });
  } catch (error) {
    handleError(res, error);
  }
};
