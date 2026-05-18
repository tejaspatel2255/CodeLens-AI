import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

const key = process.env.GROQ_API_KEY?.trim();
if (!key) {
  console.error('GROQ_API_KEY is not set in root .env');
  process.exit(1);
}

const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
  },
  body: JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: 'ping' }],
    max_tokens: 5,
  }),
});

const text = await res.text();
console.log('HTTP', res.status);
console.log(text.slice(0, 300));
