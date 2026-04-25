/**
 * Refresh Routes
 * POST /api/refresh - Trigger RSS feed update
 */

const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

/**
 * POST /api/refresh
 * Triggers background RSS scraping process
 */
router.post('/', async (req, res) => {
  try {
    const updateProcess = spawn('node', ['scraper.js'], {
      cwd: path.dirname(__dirname),
      detached: true,
      stdio: 'ignore'
    });
    updateProcess.unref();
    
    res.json({ 
      success: true, 
      message: 'News refresh started. Check back in 30 seconds.',
      refreshedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Failed to start refresh' });
  }
});

module.exports = router;
