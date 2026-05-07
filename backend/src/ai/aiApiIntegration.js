/**
 * AI API Integration (Optional)
 *
 * Shows how to integrate external AI APIs (Gemini / OpenAI) for
 * natural-language task analysis. Falls back to local scoring
 * if no API key is configured.
 *
 * Usage: Set GEMINI_API_KEY or OPENAI_API_KEY in .env
 */

/**
 * Analyze a task description using Gemini API and extract
 * required skills, experience level, and department.
 */
async function analyzeTaskWithAIAgent(taskSummary) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[AI Matchmaker] GEMINI_API_KEY is missing from .env. Skipping AI Agent integration.');
    return null;
  }

  console.log(`[AI Matchmaker] AI Agent request sent for task summary: "${taskSummary}"`);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Analyze this project task and extract requirements as JSON:
Task: "${taskSummary}"
Return ONLY valid JSON with these fields:
{
  "requiredSkills": ["skill1", "skill2"],
  "requiredExperience": <number 0-20>,
  "requiredDepartment": "IT" or "HR" or "Sales" or "",
  "priority": "Critical" or "High" or "Medium" or "Low",
  "estimatedDays": <number>
}`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();
    console.log('[AI Matchmaker] AI Agent response received (raw data):', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('[AI Matchmaker] AI Agent API returned error status:', response.status, data);
      return null;
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extract JSON securely (greedy match to handle nested objects)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedJson = JSON.parse(jsonMatch[0]);
      console.log('[AI Matchmaker] Extracted requirements from Gemini:', parsedJson);
      return parsedJson;
    } else {
      console.error('[AI Matchmaker] Failed to parse JSON from AI Agent response. Response text:', text);
      return null;
    }
  } catch (error) {
    console.error('[AI Matchmaker] AI Agent API execution error trace:', error);
    return null;
  }
}

/**
 * Analyze a task description using OpenAI API.
 */
async function analyzeTaskWithOpenAI(taskSummary) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You extract project requirements from task descriptions. Return only JSON.',
          },
          {
            role: 'user',
            content: `Extract requirements from: "${taskSummary}". Return JSON: { "requiredSkills": [], "requiredExperience": number, "requiredDepartment": "", "priority": "", "estimatedDays": number }`,
          },
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return null;
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    return null;
  }
}

/**
 * Try AI analysis — falls back gracefully if no API key set.
 */
async function analyzeTask(taskSummary) {
  // Try Gemini first, then OpenAI, then return null (use local logic)
  let result = await analyzeTaskWithAIAgent(taskSummary);
  if (result) return { ...result, source: 'aiAgent' };

  result = await analyzeTaskWithOpenAI(taskSummary);
  if (result) return { ...result, source: 'openai' };

  return null; // no API configured — local scoring will be used
}

module.exports = { analyzeTask, analyzeTaskWithAIAgent, analyzeTaskWithOpenAI };
