import express from 'express';
import { analyzeCode, askAssistant } from '../controllers/analyzeController.js';
import { aiLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/', aiLimiter, analyzeCode);
router.post('/ask', aiLimiter, askAssistant);

export default router;


