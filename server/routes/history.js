import express from 'express';
import { getHistory, getAnalysisById, deleteAnalysis } from '../controllers/historyController.js';

const router = express.Router();

router.get('/:sessionId', getHistory);
router.get('/detail/:id', getAnalysisById);
router.delete('/:id', deleteAnalysis);

export default router;
