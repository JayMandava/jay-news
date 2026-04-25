/**
 * LLM Service for Rashi Extraction and Generation
 * Uses Kimi K2.5 via Fireworks AI
 */

const axios = require('axios');
const { config } = require('../config');

/**
 * Extract Makara Rashi from scraped text
 */
async function generateRashiExtraction(rawText) {
  const prompt = `Extract ONLY the Makara Rashi (మకరం / Capricorn) predictions from this Telugu text.

Text: ${rawText.substring(0, 6000)}

Find and return:
1. Today's prediction (ఈరోజు రాశి ఫలం) - for మకరం only
2. Weekly prediction (ఈ వారం రాశి ఫలం) - for మకరం only

Return JSON:
{
  "today": "ఈరోజు మకర రాశి వారికి...",
  "weekly": "ఈ వారం మకర రాశి వారికి..."
}

If you cannot find Makara Rashi, return empty strings.`;

  try {
    const response = await axios.post(
      config.ai.url,
      {
        model: config.ai.model,
        messages: [
          { role: 'system', content: 'You extract Telugu horoscope content and return as JSON.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 600,
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
    const parsed = JSON.parse(content);
    
    return {
      today: parsed.today || '',
      weekly: parsed.weekly || ''
    };
    
  } catch (error) {
    console.error('Rashi extraction error:', error.message);
    return { today: '', weekly: '' };
  }
}

/**
 * Generate realistic Makara Rashi predictions using LLM
 * Used when scraping/extraction fails
 */
async function generateRashiPrediction() {
  const today = new Date();
  const dayName = today.toLocaleDateString('te-IN', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('te-IN', { 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });
  
  const prompt = `Generate realistic daily and weekly horoscope predictions for Makara Rashi (మకరం / Capricorn) in Telugu.

Context:
- Date: ${dateStr}
- Day: ${dayName}
- Rashi: మకరం (Capricorn)

Generate predictions that cover:
- Career/Job (ఉద్యోగం)
- Finance/Money (ఆర్థికం) 
- Health (ఆరోగ్యం)
- Family/Relationships (కుటుంబం)
- General luck (అదృష్టం)

Return JSON:
{
  "today": "ఈరోజు మకర రాశి వారికి... [2-3 sentences in Telugu covering career, finance, health]",
  "weekly": "ఈ వారం మకర రాశి వారికి... [3-4 sentences in Telugu covering overall week outlook]"
}

Make it sound authentic and positive but realistic - typical Telugu horoscope style from Eenadu.`;

  try {
    const response = await axios.post(
      config.ai.url,
      {
        model: config.ai.model,
        messages: [
          { role: 'system', content: 'You are a Telugu astrologer writing daily horoscope predictions. Write in authentic Telugu style.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.7,
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
    console.log('LLM generated rashi:', content.substring(0, 200));
    
    const parsed = JSON.parse(content);
    
    return {
      today: parsed.today || 'ఈరోజు మకర రాశి వారికి అనుకూలమైన రోజు. ఆర్థికంగా మెరుగుదల ఉంటుంది.',
      weekly: parsed.weekly || 'ఈ వారం మకర రాశి వారికి మిశ్రమ ఫలితాలు. జాగ్రత్తగా ఉండాలి.'
    };
    
  } catch (error) {
    console.error('Rashi generation error:', error.message);
    return {
      today: 'ఈరోజు మకర రాశి వారికి అనుకూలమైన రోజు. కొత్త పనులను ప్రారంభించడానికి శుభసమయం.',
      weekly: 'ఈ వారం మకర రాశి వారికి మిశ్రమ ఫలితాలు. వారం ప్రారంభంలో కొన్ని ఒత్తిడులు ఎదురైనా, మధ్యలో నుంచి పరిస్థితులు అనుకూలిస్తాయి.'
    };
  }
}

module.exports = {
  generateRashiExtraction,
  generateRashiPrediction
};
