import express from 'express';
import { signup, verifyOtp, login, me } from '../controllers/authController.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/signup', authLimiter, signup);
router.post('/verify-otp', otpLimiter, verifyOtp);
router.post('/login', authLimiter, login);
router.get('/me', me);

export default router;

