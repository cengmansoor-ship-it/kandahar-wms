import { Router } from 'express';
import * as DeliveryController from '../controllers/delivery.controller';

const router = Router();

router.get('/', DeliveryController.getDeliveries);
router.get('/:id', DeliveryController.getDeliveryById);
router.post('/from-request/:requestId', DeliveryController.createFromRequest);
router.post('/:id/items', DeliveryController.addDeliveryItems);

export default router;
