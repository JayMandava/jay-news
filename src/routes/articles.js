/**
 * Articles Routes
 * GET /api/articles - List fresh articles (scraped on-demand)
 */

const express = require('express');
const router = express.Router();
const { getFreshArticles } = require('../services/articleService');

/**
 * GET /api/articles
 * Scrapes Eenadu fresh and returns latest articles
 */
router.get('/', async (req, res) => {
  try {
    // Scrape fresh articles (like Rashiphalalu strategy)
    const articles = await getFreshArticles(50);
    
    res.json({ 
      articles,
      count: articles.length,
      scrapedAt: new Date().toISOString(),
      source: 'Eenadu'
    });
  } catch (err) {
    console.error('Scraping error:', err);
    res.status(500).json({ 
      error: err.message,
      articles: []
    });
  }
});

module.exports = router;
