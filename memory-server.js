const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;
const dbPath = '/home/jeyanth-mandava/local-news/approach.db';

// Load articles into memory at startup
let cachedArticles = [];
let cachedCategories = [];
let cachedSources = [];

console.log('Loading articles from database...');
const loadDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

loadDb.all('SELECT * FROM articles ORDER BY scrapedAt DESC', [], (err, rows) => {
  if (err) {
    console.error('Error loading articles:', err);
    process.exit(1);
  }
  cachedArticles = rows;
  console.log(`Loaded ${rows.length} articles`);
  
  // Load categories
  loadDb.all('SELECT DISTINCT category, COUNT(*) as count FROM articles GROUP BY category', [], (err, catRows) => {
    cachedCategories = catRows || [];
    
    loadDb.all('SELECT DISTINCT source, COUNT(*) as count FROM articles GROUP BY source', [], (err, srcRows) => {
      cachedSources = srcRows || [];
      loadDb.close();
      console.log('Database loaded into memory');
      startServer();
    });
  });
});

function startServer() {
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', cached: cachedArticles.length });
  });

  // Stats
  app.get('/api/stats', (req, res) => {
    res.json({
      stats: {
        totalArticles: cachedArticles.length,
        totalSources: cachedSources.length,
        totalCategories: cachedCategories.length
      }
    });
  });

  // Articles - from memory
  app.get('/api/articles', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const start = (page - 1) * limit;
    const articles = cachedArticles.slice(start, start + limit);
    
    res.json({
      articles: articles,
      pagination: {
        page: page,
        limit: limit,
        total: cachedArticles.length,
        totalPages: Math.ceil(cachedArticles.length / limit)
      }
    });
  });

  // Categories
  app.get('/api/categories', (req, res) => {
    res.json({ categories: cachedCategories });
  });

  // Sources  
  app.get('/api/sources', (req, res) => {
    res.json({ sources: cachedSources });
  });

  // Start server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Tailscale: http://100.102.200.54:${PORT}`);
    console.log(`Magic DNS: http://jay:${PORT}`);
  });
}
