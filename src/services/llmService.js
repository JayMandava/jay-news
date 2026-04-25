/**
 * LLM Service for Rashi Extraction
 * 
 * IMPORTANT: This service EXTRACTS only - does NOT create or make up content
 * If content is not found, it returns empty/not found
 */

const axios = require('axios');
const { config } = require('../config');

/**
 * Extract Makara Rashi from scraped text using LLM
 * INSTRUCTION: Extract ONLY - do NOT create or make up content
 * 
 * @param {string} rawText - Raw scraped text from Eenadu
 * @returns {Promise<Object>} - {found: boolean, content: string}
 */
async function extractMakaraRashiWithLLM(rawText) {
  const prompt = `I have scraped text from Eenadu's rashi phalalu page.

RAW TEXT:
${rawText.substring(0, 6000)}

YOUR TASK: Extract ONLY the Makara Rashi (మకరం / Capricorn) content.

INSTRUCTIONS:
1. Search for "మకరం" in the text
2. Extract the prediction content that follows it
3. Include both today's prediction and weekly if available
4. Return EXACTLY what is in the text - do NOT create or make up content
5. If Makara Rashi content is NOT found, return empty string

CRITICAL: Do NOT generate, create, or invent predictions. Only extract what exists in the text.

Return JSON:
{
  "found": true/false,
  "content": "the exact Makara Rashi text from Eenadu, or empty if not found"
}`;

  try {
    const response = await axios.post(
      config.ai.url,
      {
        model: config.ai.model,
        messages: [
          { 
            role: 'system', 
            content: 'You are a text extraction assistant. Your job is to FIND and EXTRACT existing content. You do NOT create or generate content.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.1,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Authorization': `Bearer ${config.ai.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    const content = response.data.choices[0].message.content;
    console.log('LLM extraction result:', content.substring(0, 200));
    
    const parsed = JSON.parse(content);
    
    return {
      found: parsed.found || false,
      content: parsed.content || ''
    };
    
  } catch (error) {
    console.error('LLM extraction error:', error.message);
    return { found: false, content: '' };
  }
}

module.exports = {
  extractMakaraRashiWithLLM
};
