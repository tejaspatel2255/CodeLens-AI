import express from 'express';
import { generateCode } from '../controllers/generateController.js';
import { aiLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/', aiLimiter, generateCode);

export default router;

