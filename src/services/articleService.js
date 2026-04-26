/**
 * Articles Service
 * Fresh scraping from Eenadu (like Rashiphalalu strategy)
 */

const axios = require('axios');
const cheerio = require('cheerio');

// Eenadu sections to scrape
const SECTIONS = [
  { url: 'https://www.eenadu.net/latest-news', category: 'latest', name: 'తాజా వార్తలు' },
  { url: 'https://www.eenadu.net/telangana', category: 'telangana', name: 'తెలంగాణ' },
  { url: 'https://www.eenadu.net/andhra-pradesh', category: 'andhra', name: 'ఆంధ్రప్రదేశ్' },
  { url: 'https://www.eenadu.net/sports', category: 'sports', name: 'క్రీడలు' },
  { url: 'https://www.eenadu.net/movies', category: 'cinema', name: 'సినిమా' },
  { url: 'https://www.eenadu.net/business', category: 'business', name: 'బిజినెస్' }
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
 * Scrape a single section from Eenadu
 */
async function scrapeSection(section) {
  try {
    console.log(`Scraping: ${section.name} (${section.url})`);
    
    const response = await axios.get(section.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    const articles = [];
    
    // Try multiple selectors (Eenadu specific)
    const selectors = [
      '.bt-thumb-description',  // Eenadu latest news layout
      '.news-item', '.article-item', '.story-item', 
      '.news-list-item', 'article', '[class*="news"]'
    ];
    
    for (const selector of selectors) {
      const elements = $(selector);
      
      elements.each((i, elem) => {
        if (articles.length >= 12) return false; // Max 12 per section
        
        const $elem = $(elem);
        
        // Extract title (Eenadu specific: h3.article-title-rgt)
        let title = $elem.find('h3.article-title-rgt').first().text().trim();
        
        // Fallback to other selectors
        if (!title) {
          title = $elem.find('h2, h3, h4, .title, [class*="title"]').first().text().trim();
        }
        
        if (!title || title.length < 10) return; // Skip empty/short titles
        
        // Extract link (from parent <a> tag since bt-thumb-description is inside <a>)
        let link = $elem.closest('a').attr('href') || $elem.parent('a').attr('href') || $elem.find('a').first().attr('href');
        if (link && !link.startsWith('http')) {
          link = 'https://www.eenadu.net' + (link.startsWith('/') ? '' : '/') + link;
        }
        
        // Extract image
        let image = $elem.find('img').first().attr('src') || 
                    $elem.find('img').first().attr('data-src');
        if (image && !image.startsWith('http')) {
          image = 'https://www.eenadu.net' + (image.startsWith('/') ? '' : '/') + image;
        }
        
        articles.push({
          id: `eenadu_${section.category}_${Date.now()}_${i}`,
          source: 'Eenadu',
          category: section.name,
          title: cleanTitle(title.substring(0, 200)),
          url: link || section.url,
          image: image || null,
          scrapedAt: new Date().toISOString()
        });
      });
      
      if (articles.length >= 12) break; // Stop if we have enough
    }
    
    return articles;
    
  } catch (error) {
    console.log(`Failed to scrape ${section.name}:`, error.message);
    return [];
  }
}

/**
 * Get fresh articles from Eenadu
 * Scrapes all sections and returns combined results
 */
async function getFreshArticles(limit = 50) {
  console.log('Starting fresh scrape of all sections...');
  
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
  
  console.log(`Scraped ${allArticles.length} fresh articles`);
  
  return allArticles;
}

module.exports = {
  getFreshArticles
};
