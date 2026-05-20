import { Router } from 'express';
import {
  getEmailConfigs,
  createEmailConfig,
  updateEmailConfig,
  deleteEmailConfig,
} from '../controllers/emailConfig.controller';

const router = Router();

router.get('/', getEmailConfigs);
router.post('/', createEmailConfig);
router.put('/:id', updateEmailConfig);
router.delete('/:id', deleteEmailConfig);

export default router;
