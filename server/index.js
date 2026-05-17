import dotenv from 'dotenv';
// Load environment variables at the absolute top
dotenv.config();

import express from 'express';
import cors from 'cors';
import analyzeRouter from './routes/analyze.js';
import historyRouter from './routes/history.js';

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'CodeLens AI Server' });
});

// Start listening
app.listen(PORT, () => {
  console.log(`🚀 CodeLens AI Server is active and listening on port ${PORT}`);
});
