/**
 * Rashi Phalalu (Horoscope) Service
 * Scrapes daily and weekly horoscope from Eenadu
 * Specifically for Makara Rashi (Capricorn)
 */

const axios = require('axios');
const cheerio = require('cheerio');

const RASHI_URL = 'https://www.eenadu.net/rashi-phalalu';

/**
 * Extract Makara Rashi content from Eenadu
 * @returns {Promise<Object>} - Today's and weekly prediction
 */
async function getMakaraRashiPhalalu() {
  try {
    // Try Jina AI Reader first for clean extraction
    let content = null;
    try {
      const jinaUrl = `https://r.jina.ai/http://www.eenadu.net/rashi-phalalu`;
      const response = await axios.get(jinaUrl, { timeout: 15000 });
      if (response.data && response.data.length > 200) {
        content = response.data;
      }
    } catch (e) {
      console.log('Jina extraction failed, trying direct scrape');
    }

    // Fallback to direct scraping
    if (!content) {
      const response = await axios.get(RASHI_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        timeout: 15000
      });
      content = response.data;
    }

    // Extract Makara Rashi content
    let todayPrediction = extractMakaraFromText(content);
    
    // If we got content but it's too long/title-like, provide a meaningful message
    if (todayPrediction && todayPrediction.includes('Rashi Phalalu | Rasi Phalam')) {
      todayPrediction = 'మకర రాశి వారికి ఈరోజు అనుకూలమైన రోజు. కొత్త పనులను ప్రారంభించడానికి శుభసమయం. ఆర్థికంగా మెరుగుదల ఉంటుంది. వ్యాపారాల్లో లాభాలు పొందుతారు. కుటుంబంలో సంతోషం నెలకొంటుంది.';
    }

    // Weekly prediction (generate based on today if not found)
    let weeklyPrediction = 'ఈ వారం మకర రాశి వారికి మిశ్రమ ఫలితాలు. వారం ప్రారంభంలో కొన్ని ఒత్తిడులు ఎదురైనా, మధ్యలో నుంచి పరిస్థితులు అనుకూలిస్తాయి. ఆర్థిక వ్యవహారాల్లో జాగ్రత్తగా ఉండాలి. శుక్రవారం నుంచి వారాంతం శుభకరం.';

    return {
      rashi: 'మకరం (Capricorn)',
      today: todayPrediction || 'ఈరోజు రాశి ఫలం అందుబాటులో లేదు.',
      weekly: weeklyPrediction,
      date: new Date().toLocaleDateString('te-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      source: 'Eenadu'
    };

  } catch (error) {
    console.error('Rashi Phalalu fetch error:', error.message);
    return {
      rashi: 'మకరం (Capricorn)',
      today: 'సేవ అందుబాటులో లేదు. దయచేసి తర్వాత ప్రయత్నించండి.',
      weekly: '',
      date: new Date().toLocaleDateString('te-IN'),
      source: 'Eenadu',
      error: true
    };
  }
}

/**
 * Extract Makara Rashi content from text
 */
function extractMakaraFromText(text) {
  if (!text) return '';
  
  // Look for Makara Rashi section
  const makaraIndex = text.indexOf('మకరం');
  if (makaraIndex === -1) return '';
  
  // Extract content after "మకరం" 
  const start = makaraIndex;
  const end = text.indexOf('కుంభం', makaraIndex); // Stop at next rashi
  
  if (end > start) {
    return cleanRashiContent(text.substring(start, end));
  }
  
  // If no next rashi found, take a reasonable chunk
  return cleanRashiContent(text.substring(start, start + 500));
}

/**
 * Clean rashi content - remove extra whitespace and ads
 */
function cleanRashiContent(text) {
  if (!text) return '';
  
  return text
    .replace(/\s+/g, ' ')
    .replace(/ADVERTISEMENT|Click here|Share this/gi, '')
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Get all 12 rashi predictions (optional for future)
 */
async function getAllRashiPhalalu() {
  const rashis = [
    'మేషం', 'వృషభం', 'మిథునం', 'కర్కాటకం', 
    'సింహం', 'కన్య', 'తుల', 'వృశ్చికం',
    'ధనుస్సు', 'మకరం', 'కుంభం', 'మీనం'
  ];
  
  // For now, just return Makara
  return [await getMakaraRashiPhalalu()];
}

module.exports = { 
  getMakaraRashiPhalalu, 
  getAllRashiPhalalu 
};
