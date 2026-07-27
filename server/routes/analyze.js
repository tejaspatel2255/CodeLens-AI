import express from 'express';
import { analyzeCode } from '../controllers/analyzeController.js';
import { aiLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/', aiLimiter, analyzeCode);

export default router;

