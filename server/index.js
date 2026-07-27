import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateEnv } from './lib/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root .env is the single source of truth
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

// Validate environment variables on boot
validateEnv();


import express from 'express';
import cors from 'cors';
import analyzeRouter from './routes/analyze.js';
import historyRouter from './routes/history.js';
import authRouter from './routes/authRoutes.js';
import generateRouter from './routes/generate.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Parse CORS allowed origins from environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5000'];

// Enable CORS with exact origin matching against ALLOWED_ORIGINS allowlist
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS not allowed for: ' + origin), false);
  },
  credentials: true
}));


// Setup JSON body parsing
app.use(express.json());

// Routes
app.use('/api/analyze', analyzeRouter);
app.use('/api/history', historyRouter);
app.use('/api/auth', authRouter);
app.use('/api/generate', generateRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'CodeLens AI Server' });
});

// Start listening
app.listen(PORT, () => {
  console.log(`🚀 CodeLens AI Server is active and listening on port ${PORT}`);
});
