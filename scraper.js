const axios = require('axios');
const cheerio = require('cheerio');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'approach.db');

// Database connection
const getDb = () => {
  return new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Database connection error:', err);
    }
  });
};

// User agents for rotation
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

const getRandomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)];

// Fetch HTML with retry logic
async function fetchHTML(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,te;q=0.8',
          'Connection': 'keep-alive',
        },
        timeout: 15000,
        maxRedirects: 5
      });
      return response.data;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for ${url}:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
}

// Scrape Eenadu.net
async function scrapeEenadu() {
  const articles = [];
  const sections = [
    { url: 'https://www.eenadu.net/latest-news', category: 'latest' },
    { url: 'https://www.eenadu.net/andhra-pradesh', category: 'andhra' },
    { url: 'https://www.eenadu.net/telangana', category: 'telangana' },
    { url: 'https://www.eenadu.net/sports', category: 'sports' },
    { url: 'https://www.eenadu.net/movies', category: 'cinema' },
    { url: 'https://www.eenadu.net/business', category: 'business' },
    { url: 'https://www.eenadu.net/india', category: 'national' },
    { url: 'https://www.eenadu.net/world', category: 'international' }
  ];

  for (const section of sections) {
    try {
      console.log(`Scraping Eenadu: ${section.category}...`);
      const html = await fetchHTML(section.url);
      const $ = cheerio.load(html);
      
      // Multiple selectors for different layouts
      const selectors = [
        '.news-item', '.article-item', '.story-item', '.news-list-item',
        '[class*="news"]', '[class*="story"]', 'article', '.content-item'
      ];
      
      for (const selector of selectors) {
        $(selector).each((i, elem) => {
          if (i >= 8) return false; // Limit per section
          
          const $elem = $(elem);
          const title = $elem.find('h1, h2, h3, h4, .title, [class*="title"], [class*="headline"]').first().text().trim();
          const summary = $elem.find('p, .summary, .description, [class*="desc"], [class*="summary"]').first().text().trim();
          let link = $elem.find('a').first().attr('href');
          let image = $elem.find('img').first().attr('src') || $elem.find('img').first().attr('data-src');
          
          if (title && title.length > 10) {
            // Make absolute URL
            if (link && !link.startsWith('http')) {
              link = 'https://www.eenadu.net' + (link.startsWith('/') ? '' : '/') + link;
            }
            if (image && !image.startsWith('http')) {
              image = 'https://www.eenadu.net' + (image.startsWith('/') ? '' : '/') + image;
            }
            
            articles.push({
              id: `eenadu_${Date.now()}_${i}`,
              source: 'Eenadu',
              category: section.category,
              title: title.substring(0, 200),
              summary: summary ? summary.substring(0, 400) : title.substring(0, 200),
              url: link || section.url,
              image: image || null,
              publishedAt: new Date().toISOString(),
              scrapedAt: new Date().toISOString()
            });
          }
        });
      }

      // Also try generic article extraction
      $('a').each((i, elem) => {
        const $elem = $(elem);
        const text = $elem.text().trim();
        const href = $elem.attr('href');
        
        if (text && text.length > 20 && text.length < 150 && href && !href.includes('#')) {
          // Check if it looks like a news headline (has Telugu characters or news keywords)
          const hasTelugu = /[\u0C00-\u0C7F]/.test(text);
          if (hasTelugu && !articles.find(a => a.title === text)) {
            let fullUrl = href;
            if (!href.startsWith('http')) {
              fullUrl = 'https://www.eenadu.net' + (href.startsWith('/') ? '' : '/') + href;
            }
            
            articles.push({
              id: `eenadu_link_${Date.now()}_${i}`,
              source: 'Eenadu',
              category: section.category,
              title: text.substring(0, 200),
              summary: text.substring(0, 400),
              url: fullUrl,
              image: null,
              publishedAt: new Date().toISOString(),
              scrapedAt: new Date().toISOString()
            });
          }
        }
      });

    } catch (error) {
      console.error(`Error scraping Eenadu ${section.category}:`, error.message);
    }
  }

  return articles;
}

// Scrape Andhrajyothy.com
async function scrapeAndhrajyothy() {
  const articles = [];
  const sections = [
    { url: 'https://www.andhrajyothy.com/', category: 'latest' },
    { url: 'https://www.andhrajyothy.com/andhra-pradesh', category: 'andhra' },
    { url: 'https://www.andhrajyothy.com/telangana', category: 'telangana' },
    { url: 'https://www.andhrajyothy.com/national', category: 'national' },
    { url: 'https://www.andhrajyothy.com/sports', category: 'sports' },
    { url: 'https://www.andhrajyothy.com/cinema', category: 'cinema' }
  ];

  for (const section of sections) {
    try {
      console.log(`Scraping Andhrajyothy: ${section.category}...`);
      const html = await fetchHTML(section.url);
      const $ = cheerio.load(html);
      
      // Try multiple selectors
      const selectors = [
        '.news-item', '.article-item', '.story-item', '.latest-news-item',
        '[class*="news"]', '[class*="article"]', 'article', '.content-box'
      ];
      
      for (const selector of selectors) {
        $(selector).each((i, elem) => {
          if (i >= 8) return false;
          
          const $elem = $(elem);
          const title = $elem.find('h1, h2, h3, h4, .title, [class*="title"]').first().text().trim();
          const summary = $elem.find('p, .summary, .description').first().text().trim();
          let link = $elem.find('a').first().attr('href');
          let image = $elem.find('img').first().attr('src') || $elem.find('img').first().attr('data-src');
          
          if (title && title.length > 10) {
            if (link && !link.startsWith('http')) {
              link = 'https://www.andhrajyothy.com' + (link.startsWith('/') ? '' : '/') + link;
            }
            if (image && !image.startsWith('http')) {
              image = 'https://www.andhrajyothy.com' + (image.startsWith('/') ? '' : '/') + image;
            }
            
            articles.push({
              id: `aj_${Date.now()}_${i}`,
              source: 'Andhrajyothy',
              category: section.category,
              title: title.substring(0, 200),
              summary: summary ? summary.substring(0, 400) : title.substring(0, 200),
              url: link || section.url,
              image: image || null,
              publishedAt: new Date().toISOString(),
              scrapedAt: new Date().toISOString()
            });
          }
        });
      }

      // Extract from headline links
      $('a').each((i, elem) => {
        const $elem = $(elem);
        const text = $elem.text().trim();
        const href = $elem.attr('href');
        
        if (text && text.length > 20 && text.length < 150 && href) {
          const hasTelugu = /[\u0C00-\u0C7F]/.test(text);
          if (hasTelugu && !articles.find(a => a.title === text)) {
            let fullUrl = href;
            if (!href.startsWith('http')) {
              fullUrl = 'https://www.andhrajyothy.com' + (href.startsWith('/') ? '' : '/') + href;
            }
            
            articles.push({
              id: `aj_link_${Date.now()}_${i}`,
              source: 'Andhrajyothy',
              category: section.category,
              title: text.substring(0, 200),
              summary: text.substring(0, 400),
              url: fullUrl,
              image: null,
              publishedAt: new Date().toISOString(),
              scrapedAt: new Date().toISOString()
            });
          }
        }
      });

    } catch (error) {
      console.error(`Error scraping Andhrajyothy ${section.category}:`, error.message);
    }
  }

  return articles;
}

// Save articles to database
async function saveArticles(articles) {
  const db = getDb();
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create articles table if not exists
      db.run(`
        CREATE TABLE IF NOT EXISTS articles (
          id TEXT PRIMARY KEY,
          source TEXT,
          category TEXT,
          title TEXT,
          summary TEXT,
          url TEXT,
          image TEXT,
          publishedAt TEXT,
          scrapedAt TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create index for faster queries
      db.run(`CREATE INDEX IF NOT EXISTS idx_source ON articles(source)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_category ON articles(category)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_scraped ON articles(scrapedAt)`);

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO articles 
        (id, source, category, title, summary, url, image, publishedAt, scrapedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let inserted = 0;
      for (const article of articles) {
        stmt.run([
          article.id,
          article.source,
          article.category,
          article.title,
          article.summary,
          article.url,
          article.image,
          article.publishedAt,
          article.scrapedAt
        ], (err) => {
          if (!err) inserted++;
        });
      }

      stmt.finalize((err) => {
        if (err) {
          console.error('Error finalizing statement:', err);
          reject(err);
        } else {
          console.log(`Saved ${inserted} articles to database`);
          resolve(inserted);
        }
        db.close();
      });
    });
  });
}

// Main scraping function
async function runScraper() {
  console.log('\n========================================');
  console.log('Starting News Scraper...');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('========================================\n');

  try {
    // Scrape both sources
    const [eenaduArticles, ajArticles] = await Promise.all([
      scrapeEenadu(),
      scrapeAndhrajyothy()
    ]);

    // Combine and deduplicate
    const allArticles = [...eenaduArticles, ...ajArticles];
    const uniqueArticles = allArticles.filter((article, index, self) => 
      index === self.findIndex(a => a.title === article.title && a.source === article.source)
    );

    console.log(`\nTotal articles scraped: ${uniqueArticles.length}`);
    console.log(`- Eenadu: ${eenaduArticles.length}`);
    console.log(`- Andhrajyothy: ${ajArticles.length}`);

    // Save to database
    const saved = await saveArticles(uniqueArticles);
    console.log(`\nSaved ${saved} articles to database`);

    // Clean old articles (keep last 7 days)
    const db = getDb();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    await new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM articles WHERE scrapedAt < ?`,
        [sevenDaysAgo.toISOString()],
        function(err) {
          if (err) reject(err);
          else {
            console.log(`Cleaned ${this.changes} old articles`);
            resolve();
          }
          db.close();
        }
      );
    });

    console.log('\n========================================');
    console.log('Scraping completed successfully!');
    console.log('========================================\n');

    return {
      success: true,
      totalScraped: uniqueArticles.length,
      saved: saved,
      eenadu: eenaduArticles.length,
      andhrajyothy: ajArticles.length
    };

  } catch (error) {
    console.error('Scraping failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run if called directly
if (require.main === module) {
  runScraper().then(result => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { runScraper, scrapeEenadu, scrapeAndhrajyothy, saveArticles };
