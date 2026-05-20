import express from 'express';
import { generateCode } from '../controllers/generateController.js';

const router = express.Router();

router.post('/', generateCode);

export default router;
