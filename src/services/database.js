/**
 * Database Service
 * SQLite database operations for articles
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { config } = require('../config');

const dbPath = path.resolve(config.database.path);

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
        
        // Clean titles
        const cleaned = rows.map(row => ({
          ...row,
          title: row.title ? row.title
            .replace(/\s+\d+\s*$/g, '')
            .replace(/\s+/g, ' ')
            .trim() : ''
        }));
        
        resolve(cleaned);
      }
    );
  });
}

module.exports = { getArticles, getConnection, dbPath };
