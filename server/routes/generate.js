import express from 'express';
import { generateCode, convertCode } from '../controllers/generateController.js';
import { aiLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/', aiLimiter, generateCode);
router.post('/convert', aiLimiter, convertCode);

export default router;


