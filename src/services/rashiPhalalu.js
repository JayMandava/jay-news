/**
 * Rashi Phalalu (Horoscope) Service
 * 
 * Strategy:
 * 1. Scrape individual Makara Rashi page from Eenadu
 * 2. Extract today's and weekly predictions from specific HTML structure
 * 3. Use LLM only for cleaning/parsing if extraction is messy
 */

const axios = require('axios');
const cheerio = require('cheerio');

// Eenadu individual rashi URLs
const RASHI_URLS = {
  makara: 'https://www.eenadu.net/rashi-phalalu/makar-rashi-today',
  // Other rashis available if needed:
  // mesh: 'https://www.eenadu.net/rashi-phalalu/mesh-rashi-today',
  // vrushabha: 'https://www.eenadu.net/rashi-phalalu/vrushabha-rashi-today',
  // etc.
};

/**
 * Scrape Makara Rashi page from Eenadu
 */
async function scrapeMakaraRashi() {
  try {
    const response = await axios.get(RASHI_URLS.makara, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      },
      timeout: 15000,
      maxRedirects: 5
    });
    
    return response.data;
  } catch (error) {
    console.log('Scrape failed:', error.message);
    return null;
  }
}

/**
 * Extract predictions from HTML
 * Structure: <h2 class="ttl">ఈరోజు (date)</h2> followed by <p>prediction</p>
 */
function extractFromHTML(html) {
  const $ = cheerio.load(html);
  
  // Remove scripts and styles
  $('script, style, nav, header, footer').remove();
  
  const results = {
    today: '',
    weekly: '',
    date: ''
  };
  
  // Find all h2.ttl elements (these contain ఈరోజు and ఈవారం labels)
  $('h2.ttl, h3.ttl').each((_, element) => {
    const labelText = $(element).text().trim();
    
    // Get the next paragraph (the prediction)
    let prediction = '';
    let nextEl = $(element).next();
    
    // Keep getting text until we hit another heading or non-content element
    while (nextEl.length && !nextEl.is('h2, h3, h4, .ttl')) {
      if (nextEl.is('p, div')) {
        const text = nextEl.text().trim();
        if (text.length > 20) {
          prediction += text + ' ';
        }
      }
      nextEl = nextEl.next();
    }
    
    prediction = prediction.trim();
    
    // Categorize as today or weekly
    if (labelText.includes('ఈరోజు') || labelText.includes('Today')) {
      results.today = prediction;
      // Extract date from label (e.g., "ఈరోజు (25-04-2026)")
      const dateMatch = labelText.match(/\(([^)]+)\)/);
      if (dateMatch) {
        results.date = dateMatch[1];
      }
    } else if (labelText.includes('ఈవారం') || labelText.includes('Week')) {
      results.weekly = prediction;
    }
  });
  
  return results;
}

/**
 * Fallback: Extract with LLM if cheerio fails
 */
async function extractWithLLM(html) {
  const $ = cheerio.load(html);
  const bodyText = $('body').text().substring(0, 6000);
  
  const { extractMakaraRashiWithLLM } = require('./llmService');
  return await extractMakaraRashiWithLLM(bodyText);
}

/**
 * Get Makara Rashi phalalu
 */
async function getMakaraRashiPhalalu() {
  try {
    // Step 1: Scrape the dedicated Makara Rashi page
    const html = await scrapeMakaraRashi();
    
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
    
    // Step 2: Extract with cheerio
    let results = extractFromHTML(html);
    
    // Step 3: If extraction failed or insufficient, try LLM
    if (!results.today || results.today.length < 50) {
      console.log('Cheerio extraction insufficient, trying LLM');
      const llmResults = await extractWithLLM(html);
      
      if (llmResults.found && llmResults.today) {
        results = llmResults;
      }
    }
    
    // Validate we got something
    if (!results.today || results.today.length < 30) {
      return {
        rashi: 'మకరం (Capricorn)',
        today: 'ఈరోజు రాశి ఫలం Eenadu వెబ్‌సైట్‌లో అందుబాటులో లేదు.',
        weekly: '',
        date: new Date().toLocaleDateString('te-IN'),
        source: 'Eenadu',
        extractionMethod: 'not-found'
      };
    }
    
    return {
      rashi: 'మకరం (Capricorn)',
      today: results.today.trim(),
      weekly: results.weekly ? results.weekly.trim() : 'ఈ వారం ఫలితాలు అందుబాటులో లేవు.',
      date: results.date || new Date().toLocaleDateString('te-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      source: 'Eenadu',
      extractionMethod: results.weekly ? 'extracted' : 'partial'
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
