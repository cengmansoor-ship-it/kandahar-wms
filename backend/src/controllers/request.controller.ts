import { Request, Response } from 'express';
import { RequestService } from '../services/request.service';

const handleError = (res: Response, error: any) => {
  console.error(error);
  if (error.message === 'not_found') {
    return res.status(404).json({ success: false, message: 'غوښتنه ونه موندل شوه.' });
  }
  return res.status(500).json({ success: false, message: 'تخنیکي ستونزه رامنځته شوه.', error: error.message });
};

export const getRequests = async (req: Request, res: Response) => {
  try {
    const requests = await RequestService.getRequests();
    res.json({ success: true, data: requests });
  } catch (error) {
    handleError(res, error);
  }
};

export const getRequestById = async (req: Request, res: Response): Promise<any> => {
  try {
    const request = await RequestService.getRequestById(Number(req.params.id));
    if (!request) return res.status(404).json({ success: false, message: 'غوښتنه ونه موندل شوه.' });
    res.json({ success: true, data: request });
  } catch (error) {
    handleError(res, error);
  }
};

export const createRequest = async (req: Request, res: Response) => {
  try {
    const userId = 1;
    const id = await RequestService.createRequest(req.body, userId);
    res.status(201).json({ success: true, message: 'غوښتنه په بریالیتوب سره ثبت شوه.', data: { id } });
  } catch (error) {
    handleError(res, error);
  }
};

export const updateStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { status, stage_label, action_by_name, action_by_role, comment, progress } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'حالت (Status) اړین دی.' });
    const userId = 1;
    const workflow = await RequestService.updateStatus(Number(req.params.id), status, userId, {
      stageLabelOverride: stage_label,
      actionByName: action_by_name,
      actionByRole: action_by_role,
      comment,
    });
    res.json({ success: true, message: 'د غوښتنې حالت بدل شو.', data: workflow });
  } catch (error) {
    handleError(res, error);
  }
};

export const updateLevel = async (req: Request, res: Response): Promise<any> => {
  try {
    const { level, new_level, reason } = req.body;
    const lvl = level || new_level;
    if (!lvl) return res.status(400).json({ success: false, message: 'درجه (Level) اړینه ده.' });
    const userId = 1;
    await RequestService.updateLevel(Number(req.params.id), lvl, reason || '', userId);
    res.json({ success: true, message: 'د غوښتنې درجه بدله شوه.' });
  } catch (error) {
    handleError(res, error);
  }
};

export const getLevelHistory = async (req: Request, res: Response) => {
  try {
    const history = await RequestService.getLevelHistory(Number(req.params.id));
    res.json({ success: true, data: history });
  } catch (error) {
    handleError(res, error);
  }
};

export const getPipelineHistory = async (req: Request, res: Response) => {
  try {
    const pipeline = await RequestService.getPipelineHistory(Number(req.params.id));
    res.json({ success: true, data: pipeline });
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteRequest = async (req: Request, res: Response) => {
  try {
    const userId = 1;
    await RequestService.deleteRequest(Number(req.params.id), userId);
    res.json({ success: true, message: 'غوښتنه ړنګه شوه.' });
  } catch (error) {
    handleError(res, error);
  }
};
