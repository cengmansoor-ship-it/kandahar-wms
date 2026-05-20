import { Router } from 'express';
import * as RequestController from '../controllers/request.controller';

const router = Router();

router.get('/', RequestController.getRequests);
router.get('/:id', RequestController.getRequestById);
router.post('/', RequestController.createRequest);
router.put('/:id/status', RequestController.updateStatus);
router.put('/:id/level', RequestController.updateLevel);
router.delete('/:id', RequestController.deleteRequest);

export default router;
