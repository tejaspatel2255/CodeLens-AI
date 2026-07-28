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
import helmet from 'helmet';
import analyzeRouter from './routes/analyze.js';
import historyRouter from './routes/history.js';
import authRouter from './routes/authRoutes.js';
import generateRouter from './routes/generate.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security HTTP headers
app.use(helmet());

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

// Setup JSON body parsing with explicit 100kb payload limit
app.use(express.json({ limit: '100kb' }));

// Routes
app.use('/api/analyze', analyzeRouter);
app.use('/api/history', historyRouter);
app.use('/api/auth', authRouter);
app.use('/api/generate', generateRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'CodeLens AI Server' });
});

// Catch-all 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl} - Endpoint not found.` });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'An unexpected internal server error occurred.' 
      : err.message || 'Internal Server Error'
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`🚀 CodeLens AI Server is active and listening on port ${PORT}`);
});



