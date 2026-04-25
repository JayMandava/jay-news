const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.static('/home/jeyanth-mandava/local-news/public'));

// Keep DB connection open
const db = new sqlite3.Database('/home/jeyanth-mandava/local-news/approach.db', sqlite3.OPEN_READONLY);

app.get('/api/health', (req, res) => res.json({status: 'ok'}));

app.get('/api/articles', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  db.all('SELECT * FROM articles ORDER BY scrapedAt DESC LIMIT ?', [limit], (err, rows) => {
    if (err) return res.status(500).json({error: err.message});
    res.json({articles: rows, count: rows.length});
  });
});

app.get('/api/stats', (req, res) => {
  db.get('SELECT COUNT(*) as total FROM articles', (err, row) => {
    if (err) return res.status(500).json({error: err.message});
    res.json({stats: row});
  });
});

const server = app.listen(3000, '0.0.0.0', () => {
  console.log('Server running on http://0.0.0.0:3000');
  console.log('Tailscale: http://100.102.200.54:3000');
});

// Keep alive
setInterval(() => {}, 1000);

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
