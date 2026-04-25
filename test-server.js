const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const dbPath = path.join(__dirname, 'approach.db');

// Enable CORS and JSON parsing
app.use(require('cors')());
app.use(express.json());

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Get articles with better error handling
app.get('/api/articles', (req, res) => {
  console.log('Articles request received');
  
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('DB open error:', err);
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }
    console.log('DB opened successfully');
  });

  const limit = parseInt(req.query.limit) || 20;
  
  db.all('SELECT * FROM articles ORDER BY scrapedAt DESC LIMIT ?', [limit], (err, rows) => {
    if (err) {
      console.error('Query error:', err);
      db.close();
      return res.status(500).json({ error: 'Query error: ' + err.message });
    }
    
    console.log(`Found ${rows.length} articles`);
    db.close();
    res.json({ articles: rows, count: rows.length });
  });
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
  
  db.get('SELECT COUNT(*) as count FROM articles', (err, row) => {
    db.close();
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ totalArticles: row.count });
  });
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log(`Database: ${dbPath}`);
});
