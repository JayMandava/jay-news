const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;
const dbPath = '/home/jeyanth-mandava/local-news/approach.db';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Stats
app.get('/api/stats', (req, res) => {
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
  db.get('SELECT COUNT(*) as totalArticles FROM articles', [], (err, row) => {
    db.close();
    if (err) return res.status(500).json({error: err.message});
    res.json({stats: row});
  });
});

// Articles
app.get('/api/articles', (req, res) => {
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
  const limit = parseInt(req.query.limit) || 20;
  
  db.all('SELECT * FROM articles ORDER BY scrapedAt DESC LIMIT ?', [limit], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({error: err.message});
    res.json({articles: rows, pagination: {total: rows.length}});
  });
});

// Categories
app.get('/api/categories', (req, res) => {
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
  db.all('SELECT DISTINCT category, COUNT(*) as count FROM articles GROUP BY category', [], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({error: err.message});
    res.json({categories: rows});
  });
});

// Sources  
app.get('/api/sources', (req, res) => {
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
  db.all('SELECT DISTINCT source, COUNT(*) as count FROM articles GROUP BY source', [], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({error: err.message});
    res.json({sources: rows});
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Tailscale: http://100.102.200.54:${PORT}`);
  console.log(`Magic DNS: http://jay:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
