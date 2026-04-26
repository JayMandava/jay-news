/**
 * Andhrajyothi News Service
 * Fresh scraping from Andhrajyothi (similar strategy to Eenadu)
 */

const axios = require('axios');
const cheerio = require('cheerio');

// Andhrajyothi sections to scrape
const SECTIONS = [
  { url: 'https://www.andhrajyothy.com/telangana', category: 'telangana', name: 'తెలంగాణ' },
  { url: 'https://www.andhrajyothy.com/andhra-pradesh', category: 'andhra', name: 'ఆంధ్రప్రదేశ్' },
  { url: 'https://www.andhrajyothy.com/latest-news', category: 'latest', name: 'తాజా వార్తలు' },
  { url: 'https://www.andhrajyothy.com/sports', category: 'sports', name: 'క్రీడలు' },
  { url: 'https://www.andhrajyothy.com/business', category: 'business', name: 'బిజినెస్' }
];

/**
 * Clean article title
 */
function cleanTitle(title) {
  if (!title) return '';
  
  return title
    .replace(/\n\s*\d+\s*$/g, '')
    .replace(/\t+\d+\s*$/g, '')
    .replace(/\n\s*\d+\s*\n/g, '\n')
    .replace(/\s+\d+\s*$/g, '')
    .replace(/^\d+\s+/g, '')
    .replace(/\(\s*\d+\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\t+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
}

/**
 * Scrape a single section from Andhrajyothi
 */
async function scrapeSection(section) {
  try {
    console.log(`Scraping Andhrajyothi: ${section.name}`);
    
    const response = await axios.get(section.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    const articles = [];
    
    // Andhrajyothi structure: h3 > a (title and link)
    $('h3').each((i, elem) => {
      if (articles.length >= 20) return false; // Max 20 per section (increased for 100 total target)
      
      const $a = $(elem).find('a').first();
      const title = $a.text().trim();
      let link = $a.attr('href');
      
      if (!title || title.length < 15) return; // Skip empty/short titles
      
      // Make absolute URL
      if (link && !link.startsWith('http')) {
        link = 'https://www.andhrajyothy.com' + link;
      }
      
      articles.push({
        id: `andhrajyothi_${section.category}_${Date.now()}_${i}`,
        source: 'Andhrajyothi',
        category: section.name,
        title: cleanTitle(title.substring(0, 200)),
        url: link || section.url,
        image: null, // Andhrajyothi uses lazy loading, skip for now
        scrapedAt: new Date().toISOString()
      });
    });
    
    return articles;
    
  } catch (error) {
    console.log(`Failed to scrape Andhrajyothi ${section.name}:`, error.message);
    return [];
  }
}

/**
 * Get fresh articles from Andhrajyothi
 */
async function getFreshArticles(limit = 50) {
  console.log('Starting fresh scrape of Andhrajyothi sections...');
  
  // Scrape all sections in parallel
  const scrapePromises = SECTIONS.map(section => scrapeSection(section));
  const results = await Promise.all(scrapePromises);
  
  // Combine all articles
  let allArticles = results.flat();
  
  // Remove duplicates by URL
  const seen = new Set();
  allArticles = allArticles.filter(article => {
    if (seen.has(article.url)) return false;
    seen.add(article.url);
    return true;
  });
  
  // Limit total
  allArticles = allArticles.slice(0, limit);
  
  console.log(`Scraped ${allArticles.length} fresh articles from Andhrajyothi`);
  
  return allArticles;
}

module.exports = {
  getFreshArticles
};
