const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Fireworks AI Config (Kimi K2.5 with JSON mode for clean output)
const FIREWORKS_API_KEY = process.env.FIREWORKS_API_KEY;
const FIREWORKS_MODEL = 'accounts/fireworks/routers/kimi-k2p5-turbo';
const FIREWORKS_URL = 'https://api.fireworks.ai/inference/v1/chat/completions';

if (!FIREWORKS_API_KEY) {
  console.error('ERROR: FIREWORKS_API_KEY not set. Please create .env file from .env.example');
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const dbPath = path.join(__dirname, 'approach.db');

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

// Articles - top 50 by recency
app.get('/api/articles', (req, res) => {
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
  
  db.all(
    'SELECT * FROM articles ORDER BY scrapedAt DESC LIMIT 50',
    [],
    (err, rows) => {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      
      // Clean titles - remove trailing numbers, newlines, tabs
      const cleaned = rows.map(row => ({
        ...row,
        title: row.title ? row.title
          .replace(/\s+\d+\s*$/g, '')
          .replace(/\s+/g, ' ')
          .trim() : ''
      }));
      
      res.json({ articles: cleaned });
    }
  );
});

// Refresh news from RSS
app.post('/api/refresh', async (req, res) => {
  try {
    const { spawn } = require('child_process');
    const updateProcess = spawn('node', ['updateNews.js'], {
      cwd: __dirname,
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

// Article extraction with multiple fallback strategies
async function extractArticleContent(url) {
  // Strategy 1: Try Jina AI Reader
  try {
    const jinaUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`;
    const response = await axios.get(jinaUrl, { 
      timeout: 15000,
      headers: {
        'Accept': 'text/plain, text/html',
      }
    });
    if (response.data && response.data.length > 200 && !response.data.includes('DDoS')) {
      console.log('✓ Jina extraction successful');
      return cleanExtractedText(response.data);
    }
  } catch (error) {
    console.log('✗ Jina failed:', error.message);
  }
  
  // Strategy 2: Try textise dot iitty
  try {
    const textiseUrl = `https://r.jina.ai/http://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`;
    const response = await axios.get(textiseUrl, { timeout: 10000 });
    if (response.data && response.data.length > 200) {
      console.log('✓ Alternative extraction successful');
      return cleanExtractedText(response.data);
    }
  } catch (error) {
    console.log('✗ Alternative extraction failed');
  }
  
  // Strategy 3: Direct scraping with enhanced selectors for Eenadu
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'te-IN,te;q=0.9,en-IN;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.google.com/',
        'Connection': 'keep-alive',
      },
      timeout: 15000,
      maxRedirects: 5,
      decompress: true
    });
    
    const cheerio = require('cheerio');
    const $ = cheerio.load(response.data);
    
    // Remove script, style, nav, header, footer elements
    $('script, style, nav, header, footer, .ads, .social-share, .related-news, .tags').remove();
    
    // Enhanced Eenadu-specific selectors (in order of priority)
    const selectors = [
      // Eenadu specific
      '.article-body',
      '.article-content',
      '.content-area',
      '.story-content',
      '.full-story',
      '.news-detail-content',
      '[itemprop="articleBody"]',
      // Generic
      'article .content',
      '.entry-content',
      '.post-content',
      'article',
      // Fallbacks
      '.description',
      '.news-content'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        // Get text but preserve some structure
        const text = element
          .find('p, div, h1, h2, h3, h4, h5, h6')
          .map((_, el) => $(el).text().trim())
          .get()
          .filter(t => t.length > 20 && !t.includes('ads') && !t.includes('ADVERTISEMENT'))
          .join('\n\n');
        
        if (text.length > 200) {
          console.log('✓ Direct scrape successful with selector:', selector);
          return cleanExtractedText(text);
        }
      }
    }
    
    // Last resort: extract all meaningful paragraphs
    const paragraphs = $('p')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(p => {
        const lower = p.toLowerCase();
        return p.length > 50 && 
               p.length < 2000 && // Avoid extremely long paragraphs (likely not content)
               !lower.includes('advertisement') &&
               !lower.includes('click here') &&
               !lower.includes('subscribe') &&
               !lower.includes('copyright') &&
               !lower.includes('all rights reserved') &&
               !lower.includes('follow us') &&
               !lower.includes('share this');
      });
    
    if (paragraphs.length > 0) {
      const fallbackText = paragraphs.slice(0, 15).join('\n\n'); // Limit to first 15 paragraphs
      console.log('✓ Direct scrape fallback: using paragraphs, count:', paragraphs.length);
      return cleanExtractedText(fallbackText);
    }
    
    console.log('✗ Direct scrape: no content found');
    return null;
  } catch (error) {
    console.error('✗ Direct scrape failed:', error.message);
    return null;
  }
}

// Clean extracted text
function cleanExtractedText(text) {
  if (!text) return null;
  
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
    .replace(/\t+/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ADVERTISEMENT/gi, '')
    .replace(/Click here.*?\./gi, '')
    .replace(/Share this.*?\./gi, '')
    .replace(/Follow us.*?\./gi, '')
    .substring(0, 7000)
    .trim();
}

// AI Summary via Kimi K2.5 with anti-thinking prompt
app.post('/api/summarize', async (req, res) => {
  const { url, title } = req.body;
  
  if (!url || !title) {
    return res.status(400).json({ error: 'URL and title required' });
  }
  
  // Extract article content first
  let articleContent = null;
  if (url.includes('eenadu.net') || url.includes('andhrajyothy')) {
    console.log('Extracting article content from:', url);
    articleContent = await extractArticleContent(url);
    console.log('Extracted content length:', articleContent ? articleContent.length : 0);
  }
  
  // Detect language from title
  const hasTelugu = /[\u0C00-\u0C7F]/.test(title);
  const hasHindi = /[\u0900-\u097F]/.test(title);
  const targetLanguage = hasTelugu ? 'Telugu' : (hasHindi ? 'Hindi' : 'English');
  
  try {
    const response = await axios.post(FIREWORKS_URL, {
      model: FIREWORKS_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a JSON API. Output ONLY valid JSON with this exact format:
{"summary": "First sentence. Second sentence."}

Rules:
- Respond in ${targetLanguage}
- Exactly 2 sentences only
- No other text, no markdown, no thinking`
        },
        {
          role: 'user',
          content: articleContent ? 
            `Title: ${title}\n\nContent: ${articleContent.substring(0, 4000)}`
            :
            `Title: ${title}`
        }
      ],
      max_tokens: 300,
      temperature: 0.05,
      response_format: { type: "json_object" }
    }, {
      headers: {
        'Authorization': `Bearer ${FIREWORKS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 25000
    });
    
    let content = response.data.choices[0].message.content;
    console.log('Raw AI Response:', content.substring(0, 200));
    
    // Parse JSON response
    let summary = '';
    try {
      const parsed = JSON.parse(content);
      if (parsed.summary) {
        // Clean and extract exactly 2 sentences
        let cleanSummary = parsed.summary
          .replace(/^summary:\s*/i, '')
          .replace(/^["\']|["\']$/g, '')
          .trim();
        const sentences = cleanSummary.match(/[^.!?।]+[.!?।]+/g) || [];
        summary = sentences.slice(0, 2).join(' ').trim();
      }
    } catch (e) {
      // Fallback: try to extract any readable text
      console.log('JSON parse failed, using text extraction');
      const sentences = content.replace(/[{}"]/g, '').match(/[^.!?।]+[.!?।]+/g) || [];
      summary = sentences.slice(0, 2).join(' ').trim();
    }
    
    // Validate
    if (!summary || summary.length < 15) {
      throw new Error('Invalid summary');
    }
    
    res.json({ summary });
    
  } catch (error) {
    console.error('AI Error:', error.message);
    // Return language-appropriate fallback
    const hasTelugu = /[\u0C00-\u0C7F]/.test(title);
    const fallback = hasTelugu 
      ? "సారాంశం అందుబాటులో లేదు. దయచేసి పూర్తి వార్త చదవండి."
      : "Summary unavailable. Please read the full article.";
    res.json({ summary: fallback });
  }
});

// Robust summary parser with aggressive thinking removal
function parseSummaryResponse(content, originalTitle) {
  if (!content) {
    return getFallbackSummary(originalTitle);
  }
  
  // Step 1: Try to extract from <summary> tags
  let summary = '';
  const summaryMatch = content.match(/<summary>([\s\S]*?)<\/summary>/i);
  if (summaryMatch && summaryMatch[1].trim().length > 10) {
    summary = summaryMatch[1].trim();
  }
  
  // Step 2: If no tags, try aggressive content extraction
  if (!summary) {
    // Remove common thinking patterns first
    let cleaned = content
      .replace(/the user wants.*?\./gi, '')
      .replace(/i need to.*?\./gi, '')
      .replace(/drafting.*?\./gi, '')
      .replace(/since i.*?\./gi, '')
      .replace(/without the full text.*?\./gi, '')
      .replace(/i'm inferring.*?\./gi, '')
      .replace(/given that.*?\./gi, '')
      .replace(/to be safe.*?\./gi, '')
      .replace(/i think.*?\./gi, '')
      .replace(/however.*?\./gi, '')
      .replace(/let me analyze.*?\./gi, '')
      .replace(/the title is in.*?\./gi, '')
      .replace(/which means.*?\./gi, '')
      .replace(/the article mentions.*?\./gi, '')
      .replace(/tags\.?\s*/gi, '')
      .replace(/summary:?\s*/gi, '')
      .replace(/sentence\s*\d+:?\s*/gi, '');
    
    // Extract sentences that look like actual content
    const sentences = cleaned.match(/[^.!?।]+[.!?।]+/g) || [];
    const validSentences = sentences.filter(s => {
      const lower = s.toLowerCase().trim();
      return s.length > 20 && 
             s.length < 500 &&
             !lower.startsWith('the ') &&  // Skip thinking start patterns
             !lower.startsWith('this ') &&
             !lower.startsWith('i ') &&
             !lower.startsWith('let ') &&
             !lower.includes('user wants') &&
             !lower.includes('drafting') &&
             !lower.includes('summary') &&
             !lower.includes('sentence');
    });
    
    summary = validSentences.slice(0, 2).join(' ').trim();
  }
  
  // Step 3: Clean up remaining artifacts
  summary = summary
    .replace(/<\/?summary>/gi, '')
    .replace(/^[-*•\s]+/gm, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\s+/, '')
    .trim();
  
  // Step 4: Extract exactly 2 sentences
  const finalSentences = summary.match(/[^.!?।]+[.!?।]+/g) || [];
  if (finalSentences.length > 0) {
    summary = finalSentences.slice(0, 2).join(' ').trim();
  }
  
  // Step 5: Validate the output
  if (!isValidSummary(summary, originalTitle)) {
    console.log('Summary validation failed, using fallback');
    return getFallbackSummary(originalTitle);
  }
  
  return summary;
}

// Check if summary is valid
function isValidSummary(summary, title) {
  if (!summary || summary.length < 15) return false;
  
  const lowerSummary = summary.toLowerCase();
  
  // Check for thinking patterns
  const thinkingPatterns = [
    'the user wants', 'i need to', 'drafting', 'since i',
    'without the full text', 'given that', 'to be safe',
    'however', 'sentence 1', 'the title is in',
    'which means', 'the article mentions', 'tags',
    'i\'m inferring', 'let me', 'i think', 'summary:'
  ];
  
  for (const pattern of thinkingPatterns) {
    if (lowerSummary.includes(pattern)) return false;
  }
  
  // Language validation
  const hasTeluguTitle = /[\u0C00-\u0C7F]/.test(title);
  const hasTeluguSummary = /[\u0C00-\u0C7F]/.test(summary);
  const hasHindiTitle = /[\u0900-\u097F]/.test(title);
  const hasHindiSummary = /[\u0900-\u097F]/.test(summary);
  
  // If title has Telugu/Hindi, summary must have it too
  if (hasTeluguTitle && !hasTeluguSummary) return false;
  if (hasHindiTitle && !hasHindiSummary) return false;
  
  return true;
}

// Get fallback summary in appropriate language
function getFallbackSummary(title) {
  const hasTelugu = /[\u0C00-\u0C7F]/.test(title);
  return hasTelugu 
    ? "సారాంశం అందుబాటులో లేదు. దయచేసి పూర్తి వార్త చదవండి."
    : "Summary unavailable. Please read the full article.";
}

app.listen(PORT, '0.0.0.0', () => {
  console.log('News App Server');
  console.log('Port:', PORT);
});
