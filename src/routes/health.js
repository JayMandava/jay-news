/**
 * Health Routes
 * GET /api/health - Server health check
 */

const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Returns server status and current timestamp
 */
router.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: Date.now(),
    uptime: process.uptime()
  });
});

module.exports = router;
