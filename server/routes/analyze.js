import express from 'express';
import { analyzeCode } from '../controllers/analyzeController.js';

const router = express.Router();

router.post('/', analyzeCode);

export default router;
