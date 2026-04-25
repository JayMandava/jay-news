/**
 * AI Summarizer Service
 * Generates 2-sentence summaries using Fireworks AI (Kimi K2.5)
 */

const axios = require('axios');
const { config } = require('../config');

/**
 * Detect language from text
 * @param {string} text - Text to analyze
 * @returns {string} - Language name (Telugu, Hindi, or English)
 */
function detectLanguage(text) {
  const hasTelugu = /[\u0C00-\u0C7F]/.test(text);
  const hasHindi = /[\u0900-\u097F]/.test(text);
  return hasTelugu ? 'Telugu' : (hasHindi ? 'Hindi' : 'English');
}

/**
 * Get fallback summary in appropriate language
 * @param {string} title - Article title
 * @returns {string} - Fallback summary
 */
function getFallbackSummary(title) {
  const lang = detectLanguage(title);
  return lang === 'Telugu'
    ? "సారాంశం అందుబాటులో లేదు. దయచేసి పూర్తి వార్త చదవండి."
    : "Summary unavailable. Please read the full article.";
}

/**
 * Check if summary is valid (no thinking patterns, correct language)
 * @param {string} summary - Generated summary
 * @param {string} title - Original title
 * @returns {boolean} - Whether summary is valid
 */
function isValidSummary(summary, title) {
  if (!summary || summary.length < 15) return false;
  
  const lowerSummary = summary.toLowerCase();
  
  const thinkingPatterns = [
    'the user wants', 'i need to', 'drafting', 'since i',
    'without the full text', 'given that', 'to be safe',
    'however', 'sentence 1', 'the title is in',
    'which means', 'the article mentions', 'tags',
    "i'm inferring", 'let me', 'i think', 'summary:'
  ];
  
  for (const pattern of thinkingPatterns) {
    if (lowerSummary.includes(pattern)) return false;
  }
  
  // Language validation
  const titleLang = detectLanguage(title);
  const summaryLang = detectLanguage(summary);
  
  if (titleLang === 'Telugu' && summaryLang !== 'Telugu') return false;
  if (titleLang === 'Hindi' && summaryLang !== 'Hindi') return false;
  
  return true;
}

/**
 * Generate AI summary for article
 * @param {string} title - Article title
 * @param {string} articleContent - Article content (optional)
 * @returns {Promise<string>} - Generated summary
 */
async function generateSummary(title, articleContent = null) {
  const targetLanguage = detectLanguage(title);
  
  try {
    const response = await axios.post(
      config.ai.url,
      {
        model: config.ai.model,
        messages: [
          {
            role: 'system',
            content: `You are a JSON API. Output ONLY valid JSON with this exact format:
{"summary": "First sentence. Second sentence."}

Rules:
- Respond in ${targetLanguage}
- Exactly 2 sentences only
- No other text, no markdown, no thinking`
          },
          {
            role: 'user',
            content: articleContent
              ? `Title: ${title}\n\nContent: ${articleContent.substring(0, 4000)}`
              : `Title: ${title}`
          }
        ],
        max_tokens: config.ai.maxTokens,
        temperature: config.ai.temperature,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Authorization': `Bearer ${config.ai.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: config.ai.timeout
      }
    );
    
    const content = response.data.choices[0].message.content;
    console.log('Raw AI Response:', content.substring(0, 200));
    
    // Parse JSON response
    let summary = '';
    try {
      const parsed = JSON.parse(content);
      if (parsed.summary) {
        let cleanSummary = parsed.summary
          .replace(/^summary:\s*/i, '')
          .replace(/^["\']|["\']$/g, '')
          .trim();
        const sentences = cleanSummary.match(/[^.!?।]+[.!?।]+/g) || [];
        summary = sentences.slice(0, 2).join(' ').trim();
      }
    } catch (e) {
      // Fallback: try to extract sentences
      console.log('JSON parse failed, using text extraction');
      const sentences = content.replace(/[{}"]/g, '').match(/[^.!?।]+[.!?।]+/g) || [];
      summary = sentences.slice(0, 2).join(' ').trim();
    }
    
    // Validate
    if (!summary || summary.length < 15 || !isValidSummary(summary, title)) {
      throw new Error('Invalid summary generated');
    }
    
    return summary;
  } catch (error) {
    console.error('AI Error:', error.message);
    return getFallbackSummary(title);
  }
}

module.exports = { generateSummary, detectLanguage, getFallbackSummary, isValidSummary };
