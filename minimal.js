const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.static('public'));

const db = new sqlite3.Database('/home/jeyanth-mandava/local-news/approach.db', sqlite3.OPEN_READONLY);
let articles = [];

db.all('SELECT * FROM articles LIMIT 50', [], (err, rows) => {
  if (!err) articles = rows;
  console.log('Loaded', articles.length, 'articles');
});

app.get('/api/health', (req, res) => res.json({ok: true, count: articles.length}));
app.get('/api/articles', (req, res) => res.json({articles: articles}));

app.listen(3000, '0.0.0.0', () => console.log('Running on port 3000'));
