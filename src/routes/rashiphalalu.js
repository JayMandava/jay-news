/**
 * Rashi Phalalu Routes
 * GET /api/rashiphalalu - Get Makara Rashi prediction
 */

const express = require('express');
const router = express.Router();
const { getMakaraRashiPhalalu } = require('../services/rashiPhalalu');

/**
 * GET /api/rashiphalalu
 * Returns today's and weekly Makara Rashi prediction
 */
router.get('/', async (req, res) => {
  try {
    const rashiData = await getMakaraRashiPhalalu();
    res.json(rashiData);
  } catch (error) {
    console.error('Rashi API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch rashi phalalu',
      rashi: 'మకరం (Capricorn)',
      today: 'సేవ అందుబాటులో లేదు.',
      weekly: ''
    });
  }
});

module.exports = router;
