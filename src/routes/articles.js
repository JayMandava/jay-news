/**
 * Articles Routes
 * GET /api/articles - List top articles
 */

const express = require('express');
const router = express.Router();
const { getArticles } = require('../services/database');
const { config } = require('../config');

/**
 * GET /api/articles
 * Returns top 50 articles ordered by recency
 */
router.get('/', async (req, res) => {
  try {
    const articles = await getArticles(config.scraping.articleLimit);
    res.json({ articles });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
