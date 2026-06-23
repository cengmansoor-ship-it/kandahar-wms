import { Request, Response } from 'express';
import { RequestService } from '../services/request.service';
import { SmsService } from '../services/sms.service';
import { SettingsService } from '../services/settings.service';

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
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ناسم ID.' });
    const request = await RequestService.getRequestById(id);
    if (!request) return res.status(404).json({ success: false, message: 'غوښتنه ونه موندل شوه.' });
    res.json({ success: true, data: request });
  } catch (error) {
    handleError(res, error);
  }
};

export const createRequest = async (req: Request, res: Response): Promise<any> => {
  try {
    const requesterName = req.body.requester_name || null;

    // ── Enforce daily request limit ───────────────────────────────────────────
    if (requesterName) {
      const [limit, todayCount] = await Promise.all([
        SettingsService.getDailyRequestLimit(),
        SettingsService.getTodayRequestCount(requesterName),
      ]);
      if (limit > 0 && todayCount >= limit) {
        return res.status(429).json({
          success: false,
          limit_exceeded: true,
          message: `د ورځني غوښتنو حد (${limit}) خلاص شوی. نن مو ${todayCount} غوښتنه ثبت کړې.`,
          data: { limit, today_count: todayCount },
        });
      }
    }

    const userId = 1;
    const id = await RequestService.createRequest({
      ...req.body,
      faculty_name:    req.body.faculty_name || req.body.faculty || null,
      department_name: req.body.department_name || req.body.departmentOrPerson || null,
      requester_name:  requesterName,
    }, userId);
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
    const requestId = Number(req.params.id);
    const workflow = await RequestService.updateStatus(requestId, status, userId, {
      stageLabelOverride: stage_label,
      actionByName: action_by_name,
      actionByRole: action_by_role,
      comment,
    });

    // Fire-and-forget: SMS approval notification (only fires for approval-family statuses)
    SmsService.notifyRequestApproved(requestId, status, action_by_name).catch(() => {});

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

export const getLevelHistory = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ناسم ID.' });
    const history = await RequestService.getLevelHistory(id);
    res.json({ success: true, data: history });
  } catch (error) {
    handleError(res, error);
  }
};

export const getPipelineHistory = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ناسم ID.' });
    const pipeline = await RequestService.getPipelineHistory(id);
    res.json({ success: true, data: pipeline });
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteRequest = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ناسم ID.' });
    const userId = 1;
    await RequestService.deleteRequest(id, userId);
    res.json({ success: true, message: 'غوښتنه ړنګه شوه.' });
  } catch (error) {
    handleError(res, error);
  }
};
