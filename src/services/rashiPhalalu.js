/**
 * Rashi Phalalu (Horoscope) Service
 * 
 * Strategy:
 * 1. Scrape Eenadu horoscope page
 * 2. Try to extract Makara Rashi with code (my best effort)
 * 3. If can't figure out / insufficient, give raw input to LLM
 * 4. LLM extracts ONLY - specifically instructed NOT to create/make up content
 * 5. Present extracted content in FE (could be empty if not found)
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { extractMakaraRashiWithLLM } = require('./llmService');

const RASHI_URL = 'https://www.eenadu.net/rashi-phalalu';

/**
 * Scrape Eenadu rashi page
 */
async function scrapeRashiPage() {
  try {
    const response = await axios.get(RASHI_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      },
      timeout: 15000
    });
    return response.data;
  } catch (error) {
    console.log('Scrape failed:', error.message);
    return null;
  }
}

/**
 * Try to extract Makara Rashi with code (best effort)
 */
function extractWithCode(html) {
  const $ = cheerio.load(html);
  
  // Remove non-content elements
  $('script, style, nav, header, footer, .ads').remove();
  
  // Get all text content
  let fullText = $('body').text();
  
  // Clean up whitespace
  fullText = fullText.replace(/\s+/g, ' ').trim();
  
  // Look for Makara Rashi section
  const makaraIndex = fullText.indexOf('మకరం');
  if (makaraIndex === -1) {
    return { found: false, reason: 'మకరం not found in text', text: fullText.substring(0, 3000) };
  }
  
  // Try to find section boundaries
  // Look for next rashi (కుంభం) as end marker
  const kumbhaIndex = fullText.indexOf('కుంభం', makaraIndex);
  
  let makaraSection = '';
  if (kumbhaIndex > makaraIndex) {
    makaraSection = fullText.substring(makaraIndex, kumbhaIndex);
  } else {
    // Take reasonable chunk after మకరం
    makaraSection = fullText.substring(makaraIndex, makaraIndex + 1500);
  }
  
  // Check if we got meaningful content
  if (makaraSection.length < 100 || makaraSection.includes('Rashi Phalalu | Rasi Phalam')) {
    return { 
      found: false, 
      reason: 'Insufficient or meta content only', 
      text: fullText.substring(0, 5000),
      makaraSection: makaraSection
    };
  }
  
  return { found: true, content: makaraSection };
}

/**
 * Get Makara Rashi phalalu
 */
async function getMakaraRashiPhalalu() {
  try {
    // Step 1: Scrape
    const html = await scrapeRashiPage();
    if (!html) {
      return {
        rashi: 'మకరం (Capricorn)',
        today: 'సేవ అందుబాటులో లేదు. దయచేసి తర్వాత ప్రయత్నించండి.',
        weekly: '',
        date: new Date().toLocaleDateString('te-IN'),
        source: 'Eenadu',
        error: true
      };
    }
    
    // Step 2: Try to extract with code (my best effort)
    const codeResult = extractWithCode(html);
    
    let makaraContent = '';
    let extractionMethod = '';
    
    if (codeResult.found && codeResult.content.length > 200) {
      // Code extraction worked
      makaraContent = codeResult.content;
      extractionMethod = 'code-extracted';
    } else {
      // Step 3: Can't figure out with code - give raw input to LLM
      console.log('Code extraction insufficient:', codeResult.reason);
      
      // Get raw text for LLM
      const rawText = codeResult.text || cheerio.load(html)('body').text().substring(0, 8000);
      
      // Step 4: LLM extracts ONLY (no making up content)
      const llmResult = await extractMakaraRashiWithLLM(rawText);
      
      if (llmResult.found) {
        makaraContent = llmResult.content;
        extractionMethod = 'llm-extracted';
      } else {
        // LLM couldn't find it either - don't make up content
        return {
          rashi: 'మకరం (Capricorn)',
          today: 'ఈరోజు రాశి ఫలం Eenadu వెబ్‌సైట్‌లో అందుబాటులో లేదు.',
          weekly: '',
          date: new Date().toLocaleDateString('te-IN'),
          source: 'Eenadu',
          extractionMethod: 'not-found',
          note: 'Content may not be available or is dynamically loaded'
        };
      }
    }
    
    // Step 5: Parse today vs weekly from extracted content
    // Simple heuristic: first paragraph = today, rest = weekly
    const paragraphs = makaraContent.split(/\n|\.{2,}/).filter(p => p.trim().length > 20);
    
    const today = paragraphs[0] || makaraContent.substring(0, 500);
    const weekly = paragraphs.slice(1).join(' ').substring(0, 800) || 'ఈ వారం ఫలితాలు అందుబాటులో లేవు.';
    
    return {
      rashi: 'మకరం (Capricorn)',
      today: today.trim(),
      weekly: weekly.trim(),
      date: new Date().toLocaleDateString('te-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      source: 'Eenadu',
      extractionMethod: extractionMethod
    };
    
  } catch (error) {
    console.error('Rashi service error:', error.message);
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

module.exports = { 
  getMakaraRashiPhalalu 
};
