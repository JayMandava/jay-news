# తెలుగు వార్తలు (Telugu News)

A modern, glass-morphism styled Telugu news reader with AI-powered article summarization. Fetches news from Eenadu RSS feeds and provides instant 2-sentence summaries in Telugu using Kimi K2.5 AI.

## Features

### UI/UX
- **Glass morphism design** with backdrop blur and subtle transparency
- **Animated gradient background** with 6 floating shapes
- **Card-based layout** - 50 most recent articles displayed
- **Smooth animations** - cards fade in with staggered delays
- **Modal summaries** - click "Summary" for AI-generated 2-sentence summary
- **Mobile-first** - responsive design optimized for iPhone portrait
- **Telugu typography** using Noto Sans Telugu font

### AI Summarization
- **Kimi K2.5 via Fireworks AI** - powerful multilingual LLM
- **JSON mode** - ensures clean output without "thinking" text
- **Language preservation** - Telugu articles → Telugu summaries
- **2-sentence format** - concise under 100 words
- **Full article extraction** - uses Jina AI Reader + Cheerio fallback to scrape article content

### Backend
- **Node.js + Express** - lightweight REST API
- **SQLite database** - stores 50 most recent articles
- **RSS scraping** - fetches from Eenadu.net
- **Refresh endpoint** - live refresh button triggers new RSS fetch
- **Title cleaning** - removes trailing numbers (comment counts) and whitespace

## Quick Start

```bash
# Clone the repo
git clone https://github.com/JayMandava/jay-news.git
cd jay-news

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your FIREWORKS_API_KEY

# Start the server
node server.js
```

The server will start on `http://localhost:3000`

## Environment Variables

Create a `.env` file from `.env.example`:

```env
# Required: Get your API key from https://fireworks.ai
FIREWORKS_API_KEY=your_api_key_here

# Optional: Server port (defaults to 3000)
PORT=3000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/articles` | List top 50 articles by recency |
| POST | `/api/summarize` | Get AI summary for article |
| POST | `/api/refresh` | Trigger RSS fetch for latest news |
| GET | `/api/health` | Health check |

## Usage

1. Open `http://localhost:3000` in your browser
2. Browse the 50 most recent Telugu news articles
3. Click **"Summary"** on any card to get AI-generated summary
4. Click **"Read More"** to visit the original article
5. Click **Refresh** button to fetch latest news

## Project Structure

```
jay-news/
├── server.js           # Express API + AI summarization
├── public/
│   └── index.html      # Glass UI frontend
├── .env.example        # Environment template
├── .gitignore          # Excludes node_modules, .env, *.db
└── package.json        # Dependencies
```

## Dependencies

- **express** - Web framework
- **axios** - HTTP client for RSS fetching
- **cheerio** - HTML parsing for article extraction
- **sqlite3** - Local database
- **cors** - Cross-origin support

## Live Demo

Deployed at: http://100.102.200.54:3000 (Tailscale network)

## Credits

- News data: [Eenadu.net](https://www.eenadu.net)
- AI: [Kimi K2.5 via Fireworks AI](https://fireworks.ai)
- Font: [Noto Sans Telugu](https://fonts.google.com/noto/specimen/Noto+Sans+Telugu)

## License

MIT
