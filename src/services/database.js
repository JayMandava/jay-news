/**
 * Database Service
 * SQLite database operations for articles
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { config } = require('../config');

const dbPath = path.resolve(config.database.path);

/**
 * Clean article title - remove citations, comment counts, tabs, newlines
 * @param {string} title - Raw title from database
 * @returns {string} - Cleaned title
 */
function cleanTitle(title) {
  if (!title) return '';
  
  return title
    // Remove numbers on separate lines (citations, comment counts)
    .replace(/\n\s*\d+\s*$/g, '')
    .replace(/\t+\d+\s*$/g, '')
    .replace(/\n\s*\d+\s*\n/g, '\n')
    // Remove trailing numbers with whitespace
    .replace(/\s+\d+\s*$/g, '')
    // Remove leading numbers
    .replace(/^\d+\s+/g, '')
    // Remove standalone numbers in parentheses
    .replace(/\(\s*\d+\s*\)/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .replace(/\t+/g, ' ')
    .replace(/\n+/g, ' ')
    // Final trim
    .trim();
}

/**
 * Get database connection
 * @param {number} mode - SQLite open mode (default: READONLY)
 * @returns {sqlite3.Database} - Database instance
 */
function getConnection(mode = sqlite3.OPEN_READONLY) {
  return new sqlite3.Database(dbPath, mode);
}

/**
 * Get top articles by recency
 * @param {number} limit - Number of articles to fetch
 * @returns {Promise<Array>} - Array of articles
 */
async function getArticles(limit = 50) {
  return new Promise((resolve, reject) => {
    const db = getConnection();
    
    db.all(
      'SELECT * FROM articles ORDER BY scrapedAt DESC LIMIT ?',
      [limit],
      (err, rows) => {
        db.close();
        if (err) return reject(err);
        
        // Clean titles - aggressive removal of citations, comment counts, tabs, newlines
        const cleaned = rows.map(row => ({
          ...row,
          title: row.title ? cleanTitle(row.title) : ''
        }));
        
        resolve(cleaned);
      }
    );
  });
}

module.exports = { getArticles, getConnection, dbPath };
