import { Router } from 'express';
import { getBabs, getBabById, getFaslsByBab, getAllFasls, searchBudget, importBabFasl } from '../controllers/budget.controller';

const router = Router();

router.get('/babs', getBabs);
router.get('/babs/:id', getBabById);
router.get('/babs/:id/fasls', getFaslsByBab);
router.get('/fasls', getAllFasls);
router.get('/search', searchBudget);
router.post('/import', importBabFasl);

export default router;
