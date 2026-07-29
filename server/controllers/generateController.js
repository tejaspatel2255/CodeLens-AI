import generatePrompt from '../prompts/generatePrompt.js';
import codeReviewPrompt from '../prompts/codeReviewPrompt.js';
import {
  groqJsonCompletion,
  sleep,
  DEFAULT_GENERATE_MODEL,
  DEFAULT_REVIEW_MODEL,
} from '../lib/groqJson.js';

const GENERATION_TIMEOUT_MS = 90000;
const PASS_DELAY_MS = 1500;

function validateGenerateResult(result) {
  if (!result || typeof result !== 'object') {
    throw new Error('AI returned an invalid response shape.');
  }
  if (!result.code || typeof result.code !== 'string' || !result.code.trim()) {
    throw new Error('AI did not return runnable code. Please try again.');
  }
  return {
    language: result.language || 'Unknown',
    code: result.code.trim(),
    explanation: result.explanation || '',
    complexity: result.complexity || { time: 'N/A', space: 'N/A' },
  };
}

/**
 * Estimate the right token budget so we don't burn the full 8192 on every
 * simple question. Ranges:
 *   simple  (question < 300 chars)  → 2048 gen, 2048 review
 *   medium  (300–800 chars)         → 4096 gen, 4096 review
 *   complex (> 800 chars)           → 8192 gen, 8192 review
 */
function getTokenBudget(question) {
  const len = question.trim().length;
  if (len < 300) return { gen: 2048, review: 2048, needsReview: false };
  if (len < 800) return { gen: 4096, review: 4096, needsReview: true };
  return { gen: 8192, review: 8192, needsReview: true };
}

function isReviewEnabled() {
  const flag = process.env.GROQ_GENERATE_REVIEW?.trim().toLowerCase();
  return flag !== 'false' && flag !== '0' && flag !== 'off';
}

export const generateCode = async (req, res) => {
  const { question, language } = req.body;

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'Question content cannot be empty' });
  }

  if (question.length > 20000) {
    return res.status(400).json({ error: 'Question payload is too large. Maximum allowed size is 20,000 characters per prompt.' });
  }


  const groqApiKey = process.env.GROQ_API_KEY?.trim();
  if (!groqApiKey) {
    return res.status(500).json({
      error: 'GROQ_API_KEY is not configured. Add it to the root .env file (see .env.example).',
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, GENERATION_TIMEOUT_MS);

  const userContext = `Preferred Language: ${language || 'Auto-detect'}\n\nQuestion & Constraints:\n${question.trim()}`;
  const generateModel = process.env.GROQ_GENERATE_MODEL?.trim() || DEFAULT_GENERATE_MODEL;
  const reviewModel = process.env.GROQ_REVIEW_MODEL?.trim() || DEFAULT_REVIEW_MODEL;

  // If GROQ_MAX_TOKENS is set in .env, it overrides the adaptive budget ceiling
  const envMaxTokens = parseInt(process.env.GROQ_MAX_TOKENS, 10);
  const budget = getTokenBudget(question);
  if (!isNaN(envMaxTokens) && envMaxTokens > 0) {
    budget.gen = Math.min(budget.gen, envMaxTokens);
    budget.review = Math.min(budget.review, envMaxTokens);
    // Skip review pass when we're in a lean token mode to double throughput
    if (envMaxTokens <= 2048) budget.needsReview = false;
  }

  try {
    const draft = await groqJsonCompletion({
      messages: [
        { role: 'system', content: generatePrompt },
        { role: 'user', content: userContext },
      ],
      temperature: 0.15,
      max_tokens: budget.gen,
      model: generateModel,
      signal: controller.signal,
    });

    let finalResult = validateGenerateResult(draft);

    if (isReviewEnabled() && budget.needsReview) {
      await sleep(PASS_DELAY_MS, controller.signal);

      const reviewed = await groqJsonCompletion({
        messages: [
          { role: 'system', content: codeReviewPrompt },
          {
            role: 'user',
            content: `${userContext}\n\n--- CANDIDATE SOLUTION ---\nLanguage: ${finalResult.language}\n\nCode:\n${finalResult.code}\n\n--- METADATA ---\nExplanation: ${finalResult.explanation}\nTime: ${finalResult.complexity.time}\nSpace: ${finalResult.complexity.space}`,
          },
        ],
        temperature: 0.1,
        max_tokens: budget.review,
        model: reviewModel,
        signal: controller.signal,
      });

      finalResult = validateGenerateResult(reviewed);
    }

    return res.status(200).json({ ...finalResult });
  } catch (error) {
    console.error('Generate Controller Error:', error);

    if (error.name === 'AbortError') {
      return res.status(504).json({
        error: `Generation timed out (exceeded ${GENERATION_TIMEOUT_MS / 1000} seconds). Try a shorter question or try again.`,
      });
    }

    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || 'An error occurred during code generation.',
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

export const convertCode = async (req, res) => {
  const { code, sourceLanguage, targetLanguage } = req.body;

  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'Source code content cannot be empty' });
  }
  if (!targetLanguage) {
    return res.status(400).json({ error: 'Target language must be specified' });
  }

  const groqApiKey = process.env.GROQ_API_KEY?.trim();
  if (!groqApiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured.' });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  const convertSystemPrompt = `You are an expert multi-language polyglot compiler and transpiler. Convert the given code into ${targetLanguage} cleanly, idiomatically, and preserving exact logic. Return ONLY valid JSON:
{
  "convertedCode": "the transpiled code string",
  "explanation": "brief description of key syntax differences converted",
  "targetLanguage": "${targetLanguage}"
}`;

  try {
    const result = await groqJsonCompletion({
      messages: [
        { role: 'system', content: convertSystemPrompt },
        { role: 'user', content: `Source Language: ${sourceLanguage || 'Auto-detect'}\n\nCode to convert:\n${code}` }
      ],
      temperature: 0.1,
      max_tokens: 4096,
      model: process.env.GROQ_GENERATE_MODEL?.trim() || DEFAULT_GENERATE_MODEL,
      signal: controller.signal
    });

    return res.status(200).json({
      convertedCode: result.convertedCode || '',
      explanation: result.explanation || '',
      targetLanguage: result.targetLanguage || targetLanguage
    });
  } catch (err) {
    console.error('Convert Code Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to convert code' });
  } finally {
    clearTimeout(timeoutId);
  }
};

