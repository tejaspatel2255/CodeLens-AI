import { formatGroqApiError } from './groqErrors.js';

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const DEFAULT_GENERATE_MODEL = 'llama-3.3-70b-versatile';
export const DEFAULT_REVIEW_MODEL = 'llama-3.3-70b-versatile';
const MAX_RETRIES = 3;

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
      return;
    }
    const timer = setTimeout(resolve, ms);
    if (!signal) return;
    const onAbort = () => {
      clearTimeout(timer);
      reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function getRetryDelayMs(response, attempt) {
  const retryAfter = response.headers.get('retry-after');
  if (retryAfter) {
    const seconds = Number.parseFloat(retryAfter);
    if (!Number.isNaN(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, 60000);
    }
  }
  return Math.min(2000 * 2 ** attempt, 20000);
}

async function groqFetchWithRetry({ body, signal }) {
  let lastErrorText = '';

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (signal?.aborted) {
      throw Object.assign(new Error('Aborted'), { name: 'AbortError' });
    }

    const response = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY?.trim()}`,
      },
      body: JSON.stringify(body),
      signal,
    });

    if (response.ok) {
      return response;
    }

    lastErrorText = await response.text();

    if (response.status === 429 && attempt < MAX_RETRIES) {
      const delayMs = getRetryDelayMs(response, attempt);
      console.warn(
        `Groq rate limited (429). Retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`
      );
      await sleep(delayMs, signal);
      continue;
    }

    const friendlyMessage = formatGroqApiError(response.status, lastErrorText);
    const err = new Error(friendlyMessage);
    err.statusCode =
      response.status === 401 ? 401 : response.status === 429 ? 429 : 502;
    err.isRateLimit = response.status === 429;
    throw err;
  }

  const err = new Error(formatGroqApiError(429, lastErrorText));
  err.statusCode = 429;
  err.isRateLimit = true;
  throw err;
}

/**
 * Extract and parse a JSON object from a Groq chat completion content string.
 */
export function parseGroqJsonContent(assistantMessage) {
  let cleanText = assistantMessage.trim();
  const firstBrace = cleanText.indexOf('{');
  const lastBrace = cleanText.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1) {
    cleanText = cleanText.substring(firstBrace, lastBrace + 1);
  } else {
    cleanText = cleanText.replace(/```json|```/g, '').trim();
  }

  return JSON.parse(cleanText);
}

/**
 * Call Groq chat completions and return parsed JSON from the assistant message.
 * Automatically retries on HTTP 429 with backoff.
 */
export async function groqJsonCompletion({
  messages,
  temperature = 0.15,
  max_tokens = 4096,
  signal,
  model = DEFAULT_GENERATE_MODEL,
}) {
  const groqApiKey = process.env.GROQ_API_KEY?.trim();
  if (!groqApiKey) {
    const err = new Error(
      'GROQ_API_KEY is not configured. Add it to the root .env file (see .env.example).'
    );
    err.statusCode = 500;
    throw err;
  }

  const response = await groqFetchWithRetry({
    body: {
      model,
      response_format: { type: 'json_object' },
      messages,
      temperature,
      max_tokens,
    },
    signal,
  });

  const data = await response.json();
  const assistantMessage = data.choices?.[0]?.message?.content;

  if (!assistantMessage) {
    throw new Error('Groq returned an empty response');
  }

  try {
    return parseGroqJsonContent(assistantMessage);
  } catch (parseError) {
    console.error('Failed to parse Groq JSON:', assistantMessage);
    console.error(parseError);
    throw new Error('AI response was not valid JSON. Please try again.');
  }
}

export { sleep };
