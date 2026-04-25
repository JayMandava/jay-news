/**
 * Article Extraction Service
 * Extracts article content from URLs using multiple fallback strategies
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { config } = require('../config');

/**
 * Clean extracted text by removing ads, normalizing whitespace, etc.
 * @param {string} text - Raw extracted text
 * @returns {string|null} - Cleaned text or null if empty
 */
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

/**
 * Strategy 1: Extract using Jina AI Reader
 * @param {string} url - Article URL
 * @returns {Promise<string|null>} - Extracted content or null
 */
async function extractWithJina(url) {
  try {
    const jinaUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`;
    const response = await axios.get(jinaUrl, {
      timeout: config.scraping.jinaTimeout,
      headers: { 'Accept': 'text/plain, text/html' }
    });
    
    if (response.data && response.data.length > 200 && !response.data.includes('DDoS')) {
      console.log('✓ Jina extraction successful');
      return cleanExtractedText(response.data);
    }
  } catch (error) {
    console.log('✗ Jina failed:', error.message);
  }
  return null;
}

/**
 * Strategy 2: Extract using alternative Jina endpoint
 * @param {string} url - Article URL
 * @returns {Promise<string|null>} - Extracted content or null
 */
async function extractWithAlternative(url) {
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
  return null;
}

/**
 * Strategy 3: Direct scraping with Cheerio
 * @param {string} url - Article URL
 * @returns {Promise<string|null>} - Extracted content or null
 */
async function extractWithScraping(url) {
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
      timeout: config.scraping.scrapeTimeout,
      maxRedirects: 5,
      decompress: true
    });
    
    const $ = cheerio.load(response.data);
    
    // Remove non-content elements
    $('script, style, nav, header, footer, .ads, .social-share, .related-news, .tags').remove();
    
    // Try selectors in order of priority
    const selectors = [
      '.article-body', '.article-content', '.content-area', '.story-content',
      '.full-story', '.news-detail-content', '[itemprop="articleBody"]',
      'article .content', '.entry-content', '.post-content', 'article',
      '.description', '.news-content'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
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
    
    // Fallback: extract paragraphs
    const paragraphs = $('p')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(p => {
        const lower = p.toLowerCase();
        return p.length > 50 && 
               p.length < 2000 &&
               !lower.includes('advertisement') &&
               !lower.includes('click here') &&
               !lower.includes('subscribe') &&
               !lower.includes('copyright') &&
               !lower.includes('all rights reserved') &&
               !lower.includes('follow us') &&
               !lower.includes('share this');
      });
    
    if (paragraphs.length > 0) {
      const fallbackText = paragraphs.slice(0, 15).join('\n\n');
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

/**
 * Extract article content using multiple fallback strategies
 * @param {string} url - Article URL
 * @returns {Promise<string|null>} - Extracted content or null
 */
async function extractArticleContent(url) {
  // Try strategies in order
  let content = await extractWithJina(url);
  if (content) return content;
  
  content = await extractWithAlternative(url);
  if (content) return content;
  
  content = await extractWithScraping(url);
  if (content) return content;
  
  return null;
}

module.exports = { extractArticleContent, cleanExtractedText };
