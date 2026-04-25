/**
 * Configuration module
 * Centralized configuration management following 12-factor app principles
 */

require('dotenv').config();

const config = {
  // Server
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  database: {
    path: process.env.DB_PATH || './data/approach.db'
  },
  
  // AI Service (Fireworks)
  ai: {
    apiKey: process.env.FIREWORKS_API_KEY,
    model: process.env.FIREWORKS_MODEL || 'accounts/fireworks/routers/kimi-k2p5-turbo',
    url: process.env.FIREWORKS_URL || 'https://api.fireworks.ai/inference/v1/chat/completions',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS, 10) || 300,
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.05,
    timeout: parseInt(process.env.AI_TIMEOUT, 10) || 25000
  },
  
  // RSS Scraping
  scraping: {
    articleLimit: parseInt(process.env.ARTICLE_LIMIT, 10) || 50,
    jinaTimeout: parseInt(process.env.JINA_TIMEOUT, 10) || 15000,
    scrapeTimeout: parseInt(process.env.SCRAPE_TIMEOUT, 10) || 15000
  }
};

// Validate required configuration
function validateConfig() {
  const errors = [];
  
  if (!config.ai.apiKey) {
    errors.push('FIREWORKS_API_KEY is required. Please set it in .env file');
  }
  
  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
}

module.exports = { config, validateConfig };
