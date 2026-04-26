/**
 * Articles Routes
 * GET /api/articles - List fresh articles (scraped on-demand)
 * Query params: sources=eenadu,andhrajyothi (default: eenadu)
 */

const express = require('express');
const router = express.Router();
const { getFreshArticles: getEenaduArticles } = require('../services/articleService');
const { getFreshArticles: getAndhrajyothiArticles } = require('../services/andhrajyothiService');

/**
 * GET /api/articles
 * Scrapes news sources fresh and returns latest articles
 * Query: ?sources=eenadu,andhrajyothi (default: eenadu)
 */
router.get('/', async (req, res) => {
  try {
    // Parse sources from query, default to 'eenadu' for backward compatibility
    const sourcesParam = req.query.sources || 'eenadu';
    const sources = sourcesParam.split(',').map(s => s.trim().toLowerCase());
    
    const validSources = ['eenadu', 'andhrajyothi'];
    const requestedSources = sources.filter(s => validSources.includes(s));
    
    // If no valid sources, default to eenadu
    if (requestedSources.length === 0) {
      requestedSources.push('eenadu');
    }
    
    console.log(`Fetching articles from: ${requestedSources.join(', ')}`);
    
    // Scrape from requested sources in parallel
    const scrapePromises = [];
    
    if (requestedSources.includes('eenadu')) {
      scrapePromises.push(
        getEenaduArticles(50).then(articles => 
          articles.map(a => ({ ...a, provider: 'Eenadu' }))
        )
      );
    }
    
    if (requestedSources.includes('andhrajyothi')) {
      scrapePromises.push(
        getAndhrajyothiArticles(50).then(articles => 
          articles.map(a => ({ ...a, provider: 'Andhrajyothi' }))
        )
      );
    }
    
    const results = await Promise.all(scrapePromises);
    let allArticles = results.flat();
    
    // Sort by scrapedAt (most recent first) - mix from both sources
    allArticles.sort((a, b) => new Date(b.scrapedAt) - new Date(a.scrapedAt));
    
    // Limit total
    allArticles = allArticles.slice(0, 60);
    
    res.json({ 
      articles: allArticles,
      count: allArticles.length,
      sources: requestedSources,
      scrapedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Scraping error:', err);
    res.status(500).json({ 
      error: err.message,
      articles: [],
      sources: []
    });
  }
});

module.exports = router;
