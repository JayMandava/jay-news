/**
 * తెలుగు వార్తలు (Telugu News)
 * 
 * A modern, glass-morphism styled Telugu news reader with AI-powered
 * article summarization. Fetches fresh news from Eenadu and provides
 * instant 2-sentence summaries in Telugu using Kimi K2.5 AI.
 * 
 * @author Jay Mandava
 * @version 1.0.0
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Configuration
const { config, validateConfig } = require('./src/config');

// Validate configuration before starting
validateConfig();

// Routes
const healthRoutes = require('./src/routes/health');
const articlesRoutes = require('./src/routes/articles');
const summarizeRoutes = require('./src/routes/summarize');
const rashiPhalaluRoutes = require('./src/routes/rashiphalalu');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/summarize', summarizeRoutes);
app.use('/api/rashiphalalu', rashiPhalaluRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(config.port, config.host, () => {
  console.log('╔════════════════════════════════════════╗');
  console.log('║     తెలుగు వార్తలు (Telugu News)        ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`Server running at http://${config.host}:${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log('Press Ctrl+C to stop\n');
});

module.exports = app;
