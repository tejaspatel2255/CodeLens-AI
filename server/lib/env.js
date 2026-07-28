import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure root .env is loaded first
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

const requiredEnvVars = [
  'JWT_SECRET',
  'GROQ_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'BREVO_API_KEY',
  'BREVO_FROM_EMAIL',
];



export const validateEnv = () => {
  const missing = [];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar] || !process.env[envVar].trim()) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error(`\n❌ CRITICAL FATAL CONFIGURATION ERROR:`);
    console.error(`Missing required environment variables in server runtime: ${missing.join(', ')}`);
    console.error(`Please update your root .env file before starting the server.\n`);
    process.exit(1);
  }
};

export const JWT_SECRET = process.env.JWT_SECRET?.trim();
