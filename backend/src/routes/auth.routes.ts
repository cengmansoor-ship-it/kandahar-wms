import { Router } from 'express';
import { sendForgotPasswordOtp, verifyForgotPasswordOtp, resetPassword, changePassword } from '../controllers/auth.controller';

const router = Router();

router.post('/forgot-password/send-otp', sendForgotPasswordOtp);
router.post('/forgot-password/verify-otp', verifyForgotPasswordOtp);
router.post('/forgot-password/reset-password', resetPassword);
router.post('/change-password', changePassword);

export default router;
