import express from 'express';
import { getHistory, getAnalysisById } from '../controllers/historyController.js';

const router = express.Router();

router.get('/:sessionId', getHistory);
router.get('/detail/:id', getAnalysisById);

export default router;
