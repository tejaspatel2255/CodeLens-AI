import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root .env is the single source of truth (override stale OS-level GROQ_API_KEY)
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

if (!process.env.GROQ_API_KEY?.trim()) {
  console.warn(
    '⚠️  GROQ_API_KEY is missing. Code analysis will fail until you add a key to the root .env file.'
  );
}

import express from 'express';
import cors from 'cors';
import analyzeRouter from './routes/analyze.js';
import historyRouter from './routes/history.js';
import authRouter from './routes/authRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend development server
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Setup JSON body parsing
app.use(express.json());

// Routes
app.use('/api/analyze', analyzeRouter);
app.use('/api/history', historyRouter);
app.use('/api/auth', authRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'TraceVerse AI Server' });
});

// Start listening
app.listen(PORT, () => {
  console.log(`🚀 TraceVerse AI Server is active and listening on port ${PORT}`);
});
