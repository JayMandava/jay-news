# Local Telugu News - Kindle Style Reader

A polished, Kindle-style web application for reading Telugu news from Eenadu.net and Andhrajyothy.com. Features a realistic book interface with page-flip animations, category filtering, and offline-capable architecture.

## Features

### UI/UX
- **Kindle-style book interface** with realistic page flip animations
- **Two-page spread layout** for desktop, responsive single-page for mobile
- **Touch gestures** - swipe left/right to turn pages
- **E-ink inspired typography** with high contrast and Telugu fonts (Noto Serif Telugu)
- **Category filtering** - Andhra Pradesh, Telangana, Sports, Cinema, National, International
- **Source filtering** - Toggle between Eenadu and Andhrajyothy
- **Article modal** - Click any article to read in a clean modal view

### Backend
- **Automated scraping** - Every 30 minutes via node-cron
- **SQLite database** for article caching
- **RESTful API** for fetching articles with pagination
- **Multi-source scraping** - Eenadu.net and Andhrajyothy.com
- **Retry logic** for resilient scraping
- **Data deduplication** and 7-day retention policy

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or run in development mode with auto-restart
npm run dev
```

The server will start on `http://localhost:3000` and automatically scrape articles on startup.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/articles` | List all articles (with pagination, search, filters) |
| GET | `/api/articles/source/:source` | Filter by source (Eenadu, Andhrajyothy) |
| GET | `/api/articles/category/:category` | Filter by category |
| GET | `/api/categories` | List all categories with counts |
| GET | `/api/sources` | List all sources with counts |
| GET | `/api/stats` | Get database statistics |
| POST | `/api/scrape` | Manually trigger scraping |
| GET | `/api/health` | Health check |

### Query Parameters for `/api/articles`

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `source` - Filter by source
- `category` - Filter by category
- `search` - Search in title and summary

## Project Structure

```
local-news/
├── package.json          # Dependencies and scripts
├── server.js             # Express server and API routes
├── scraper.js            # Web scraping logic
├── approach.db           # SQLite database (created on first run)
└── public/               # Frontend files
    ├── index.html        # Main HTML
    ├── styles.css        # Kindle-style CSS
    └── app.js            # Frontend JavaScript
```

## Controls

### Desktop
- **Click left edge** (20%) - Previous page
- **Click right edge** (20%) - Next page
- **Arrow keys** - Navigate pages (Left/Right)
- **Escape** - Close article modal

### Mobile/Tablet
- **Swipe left** - Next page
- **Swipe right** - Previous page
- **Tap article** - Open in modal

### Navigation Bar
- **Category buttons** - Filter by category
- **Filter icon** - Toggle sources (Eenadu/Andhrajyothy)
- **Refresh icon** - Manually trigger new scraping

## Technical Details

### Scraping Strategy
The scraper uses Cheerio for HTML parsing with multiple fallback selectors to handle varying page structures. It extracts:
- Article title
- Summary/description
- Image URL (when available)
- Source link
- Category
- Publication date

### Database Schema
```sql
CREATE TABLE articles (
    id TEXT PRIMARY KEY,
    source TEXT,
    category TEXT,
    title TEXT,
    summary TEXT,
    url TEXT,
    image TEXT,
    publishedAt TEXT,
    scrapedAt TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### CSS 3D Page Flip
The book uses CSS 3D transforms for realistic page turn animations:
- `transform-style: preserve-3d` for depth
- `rotateY()` for page curl effect
- `cubic-bezier` easing for natural motion
- Z-index layering for proper page stacking

## Data Sources

### Eenadu.net
Sections scraped:
- Latest News
- Andhra Pradesh
- Telangana
- Sports
- Cinema/Movies
- Business
- National (India)
- International (World)

### Andhrajyothy.com
Sections scraped:
- Latest News (homepage)
- Andhra Pradesh
- Telangana
- National
- Sports
- Cinema (404 on some subsections, handled gracefully)

## Customization

### Change Scraping Frequency
Edit `server.js`:
```javascript
cron.schedule('*/30 * * * *', async () => {
  // Change */30 to desired minutes
});
```

### Modify Page Layout
Edit `public/styles.css`:
```css
.page {
  /* Adjust aspect-ratio, padding, fonts */
}
```

### Add More Sources
Edit `scraper.js` and add new scraper functions following the existing pattern.

## Troubleshooting

### No articles loading
1. Check server logs: `npm start`
2. Verify database exists: `ls -la approach.db`
3. Manually trigger scrape: POST to `/api/scrape`

### Scraping fails
- Some sections may 404 (handled gracefully)
- User-agent rotation prevents blocking
- Retry logic handles transient failures

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## License

MIT License - Feel free to modify and distribute.

## Credits

- Telugu fonts: [Google Fonts - Noto Sans/Serif Telugu](https://fonts.google.com/noto/specimen/Noto+Sans+Telugu)
- News sources: [Eenadu.net](https://www.eenadu.net) and [Andhrajyothy.com](https://www.andhrajyothy.com)

---

Built with Node.js, Express, Cheerio, and vanilla JavaScript.
