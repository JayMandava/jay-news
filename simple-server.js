const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const dbPath = '/home/jeyanth-mandava/local-news/approach.db';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health
app.get('/api/health', (req, res) => res.json({status: 'ok'}));

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

app.listen(3000, '0.0.0.0', () => console.log('Server running on http://0.0.0.0:3000 (Tailscale: http://100.102.200.54:3000)'));
