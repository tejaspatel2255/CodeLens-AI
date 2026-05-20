/**
 * Turn Groq HTTP error bodies into actionable messages for the UI.
 */
export function formatGroqApiError(status, rawBody) {
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return `Groq API returned HTTP ${status}. Check your GROQ_API_KEY in the project root .env file.`;
  }

  const code = payload?.error?.code;
  const message = payload?.error?.message;

  if (status === 401 || code === 'expired_api_key' || code === 'invalid_api_key') {
    return [
      'Your Groq API key is invalid or has expired.',
      'Create a new key at https://console.groq.com/keys',
      'Update GROQ_API_KEY in the root .env file, then restart the server (npm run dev).',
    ].join(' ');
  }

  if (status === 429) {
    const retryHint = message?.includes('retry')
      ? message
      : 'Groq free-tier limits apply per minute. Wait 30–60 seconds, avoid rapid clicks, then try again.';
    return retryHint;
  }

  return message
    ? `Groq API error: ${message}`
    : `Groq API returned HTTP ${status}.`;
}
