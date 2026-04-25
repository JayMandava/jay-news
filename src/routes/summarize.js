/**
 * Summarize Routes
 * POST /api/summarize - Generate AI summary for article
 */

const express = require('express');
const router = express.Router();
const { extractArticleContent } = require('../services/articleExtractor');
const { generateSummary } = require('../services/summarizer');

/**
 * POST /api/summarize
 * Generates 2-sentence AI summary for given article
 */
router.post('/', async (req, res) => {
  const { url, title } = req.body;
  
  if (!url || !title) {
    return res.status(400).json({ error: 'URL and title required' });
  }
  
  try {
    // Extract article content if URL is from supported source
    let articleContent = null;
    if (url.includes('eenadu.net') || url.includes('andhrajyothy')) {
      console.log('Extracting article content from:', url);
      articleContent = await extractArticleContent(url);
      console.log('Extracted content length:', articleContent ? articleContent.length : 0);
    }
    
    // Generate summary
    const summary = await generateSummary(title, articleContent);
    res.json({ summary });
  } catch (error) {
    console.error('Summarize error:', error);
    // Return generic fallback
    res.json({ 
      summary: "సారాంశం అందుబాటులో లేదు. దయచేసి పూర్తి వార్త చదవండి." 
    });
  }
});

module.exports = router;
