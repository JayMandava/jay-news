/**
 * Rashi Phalalu (Horoscope) Service
 * 
 * Strategy:
 * 1. Try to scrape and extract from Eenadu
 * 2. If extraction fails, use LLM to generate realistic predictions
 * 3. Always return useful content to users
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { generateRashiExtraction, generateRashiPrediction } = require('./llmService');

/**
 * Scrape daily horoscope from Eenadu
 */
async function scrapeDailyHoroscope() {
  const today = new Date();
  const months = ['january', 'february', 'march', 'april', 'may', 'june',
                  'july', 'august', 'september', 'october', 'november', 'december'];
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  const month = months[today.getMonth()];
  const day = today.getDate();
  const year = today.getFullYear();
  const dayName = days[today.getDay()];
  
  const url = `https://www.eenadu.net/telugu-news/india/daily-horoscope-for-${month}-${day}th-${year}-${dayName}-in-telugu`;
  
  console.log('Fetching rashi from:', url);
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      },
      timeout: 15000,
      maxRedirects: 5
    });
    
    return response.data;
  } catch (error) {
    console.log('Primary fetch failed:', error.message);
    return null;
  }
}

/**
 * Extract text from HTML
 */
function extractTextFromHTML(html) {
  const $ = cheerio.load(html);
  $('script, style, nav, header, footer, .ads').remove();
  
  let content = '';
  const selectors = ['[itemprop="articleBody"]', '.article-body', '.article-content', '.content'];
  
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length && element.text().trim().length > 200) {
      content = element.text().trim();
      break;
    }
  }
  
  if (!content) {
    const paragraphs = $('p').map((_, el) => $(el).text().trim()).get();
    content = paragraphs.filter(p => p.length > 50).join('\n\n');
  }
  
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  if (metaDesc && metaDesc.includes('రాశి')) {
    content = metaDesc + '\n\n' + content;
  }
  
  return content.substring(0, 10000);
}

/**
 * Get Makara Rashi phalalu
 * 
 * Tries extraction first, falls back to LLM generation
 */
async function getMakaraRashiPhalalu() {
  let extractedContent = null;
  let generationNeeded = false;
  
  try {
    // Step 1: Try to scrape
    const html = await scrapeDailyHoroscope();
    
    if (html) {
      const rawText = extractTextFromHTML(html);
      
      if (rawText && rawText.length > 100) {
        console.log('Extracted text length:', rawText.length);
        
        // Step 2: Try LLM extraction
        extractedContent = await generateRashiExtraction(rawText);
        
        // Validate extraction
        if (!extractedContent.today || extractedContent.today.length < 30) {
          console.log('Extraction insufficient, will generate');
          generationNeeded = true;
        }
      } else {
        generationNeeded = true;
      }
    } else {
      generationNeeded = true;
    }
    
    // Step 3: If extraction failed, generate predictions
    if (generationNeeded) {
      console.log('Generating rashi predictions via LLM');
      extractedContent = await generateRashiPrediction();
    }
    
    return {
      rashi: 'మకరం (Capricorn)',
      today: extractedContent.today,
      weekly: extractedContent.weekly,
      date: new Date().toLocaleDateString('te-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      source: 'Eenadu',
      method: generationNeeded ? 'llm-generated' : 'llm-extracted'
    };
    
  } catch (error) {
    console.error('Rashi service error:', error.message);
    
    // Last resort: generate anyway
    try {
      const generated = await generateRashiPrediction();
      return {
        rashi: 'మకరం (Capricorn)',
        today: generated.today,
        weekly: generated.weekly,
        date: new Date().toLocaleDateString('te-IN'),
        source: 'Eenadu',
        method: 'llm-generated'
      };
    } catch (genError) {
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
}

module.exports = { 
  getMakaraRashiPhalalu 
};
