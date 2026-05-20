import { Request, Response } from 'express';
import { DeliveryService } from '../services/delivery.service';

const handleError = (res: Response, error: any) => {
  console.error(error);
  if (error.message === 'request_not_found') return res.status(404).json({ success: false, message: 'غوښتنه ونه موندل شوه.' });
  if (error.message === 'delivery_not_found') return res.status(404).json({ success: false, message: 'د تسلیمۍ ریکارډ ونه موندل شو.' });
  if (error.message.startsWith('insufficient_stock_for_item')) return res.status(400).json({ success: false, message: 'په ګدام کې موجودي کمه ده.' });
  return res.status(500).json({ success: false, message: 'تخنیکي ستونزه رامنځته شوه.', error: error.message });
};

export const getDeliveries = async (req: Request, res: Response) => {
  try {
    const deliveries = await DeliveryService.getDeliveries();
    res.json({ success: true, data: deliveries });
  } catch (error) {
    handleError(res, error);
  }
};

export const getDeliveryById = async (req: Request, res: Response): Promise<any> => {
  try {
    const delivery = await DeliveryService.getDeliveryById(Number(req.params.id));
    if (!delivery) return res.status(404).json({ success: false, message: 'تسلیمي ونه موندل شوه.' });
    res.json({ success: true, data: delivery });
  } catch (error) {
    handleError(res, error);
  }
};

export const createFromRequest = async (req: Request, res: Response) => {
  try {
    const userId = 1;
    const id = await DeliveryService.createFromRequest(Number(req.params.requestId), req.body, userId);
    res.status(201).json({ success: true, message: 'د تسلیمۍ فورم جوړ شو.', data: { id } });
  } catch (error) {
    handleError(res, error);
  }
};

export const addDeliveryItems = async (req: Request, res: Response): Promise<any> => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'اجناس ندي داخل شوي.' });
    }
    const userId = 1;
    await DeliveryService.addDeliveryItems(Number(req.params.id), items, userId);
    res.json({ success: true, message: 'اجناس تسلیم او له ګدام څخه کم شول.' });
  } catch (error) {
    handleError(res, error);
  }
};
