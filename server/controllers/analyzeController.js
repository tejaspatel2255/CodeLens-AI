import { supabase } from '../lib/supabase.js';
import { formatGroqApiError } from '../lib/groqErrors.js';
import systemPrompt from '../prompts/systemPrompt.js';

export const analyzeCode = async (req, res) => {
  const { code, sessionId, language, makePublic } = req.body;


  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'Code content cannot be empty' });
  }

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  const groqApiKey = process.env.GROQ_API_KEY?.trim();
  if (!groqApiKey) {
    return res.status(500).json({
      error: 'GROQ_API_KEY is not configured. Add it to the root .env file (see .env.example).',
    });
  }

  // Create AbortController for a 30-second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 30000);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Language Context: ${language || 'Auto-detect'}\n\nCode to analyze:\n${code}` }
        ],
        temperature: 0.3,
        max_tokens: 4000
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      const friendlyMessage = formatGroqApiError(response.status, errorText);
      const statusCode = response.status === 401 ? 401 : 502;
      return res.status(statusCode).json({ error: friendlyMessage });
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('Groq returned an empty response');
    }

    // Clean text by isolating JSON boundaries (from the first '{' to the last '}')
    let cleanText = assistantMessage.trim();
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    } else {
      cleanText = cleanText.replace(/```json|```/g, "").trim();
    }
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse clean text:', cleanText);
      console.error(parseError);
      throw new Error('AI response was not valid JSON. Please try running the analysis again.');
    }

    // Save to Supabase
    const { data: dbData, error: dbError } = await supabase
      .from('code_analyses')
      .insert([
        {
          user_session: sessionId,
          language: parsedResult.language || 'Plain Text',
          original_code: code,
          summary: parsedResult.summary || '',
          steps: parsedResult.steps || [],
          bugs: parsedResult.bugs || [],
          optimizations: parsedResult.optimizations || [],
          concepts: parsedResult.concepts || [],
          flow: parsedResult.flow || '',
          is_public: Boolean(makePublic)
        }
      ])

      .select();

    if (dbError) {
      console.error('Supabase DB Insert Error:', dbError);
      // We still return the parsed result to the frontend even if DB save fails,
      // but log it for backend visibility.
    }

    const savedRow = dbData && dbData.length > 0 ? dbData[0] : null;

    // Return full result along with database ID if saved
    return res.status(200).json({
      id: savedRow ? savedRow.id : null,
      ...parsedResult
    });

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Analysis Controller Error:', error);
    
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Analysis timed out (exceeded 30 seconds). Please try with a smaller code block.' });
    }
    
    return res.status(500).json({ error: error.message || 'An error occurred during code analysis.' });
  }
};
