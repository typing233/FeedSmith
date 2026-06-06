# FeedSmith

A configurable RSS feed generator that scrapes websites and serves standardized RSS 2.0 feeds via HTTP. Supports both static HTML and JavaScript-rendered pages.

## Features

- **Declarative route configs** — Define scraping rules in simple YAML files
- **Static & dynamic fetching** — Built-in HTTP for static pages, Puppeteer for JS-rendered content
- **Anti-scraping measures** — User-agent rotation, request caching, configurable delays
- **Plugin architecture** — Hot-reload YAML routes, or load JS plugin modules
- **RSS 2.0 compliant** — Valid XML output subscribable by any RSS reader

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Start the server
npm start

# Or run in development mode
npm run dev
```

The server starts at `http://localhost:3000`. Available endpoints:

| Endpoint | Description |
|----------|-------------|
| `GET /` | Lists all available feeds as JSON |
| `GET /health` | Health check |
| `GET /feed/:name` | Returns RSS 2.0 XML for the named route |

## Adding a New Route

Create a YAML file in the `routes/` directory. The filename (without extension) becomes the feed URL path.

### Example: `routes/my-site.yaml`

```yaml
name: My Site Feed
description: Latest posts from My Site
url: https://example.com/blog

# Set to true for JavaScript-rendered pages (uses Puppeteer)
dynamic: false
# CSS selector to wait for before extracting (only for dynamic)
# waitFor: ".post-list"

# CSS selector matching each item/entry on the page
itemSelector: "article.post"

# Field extraction selectors (relative to each item)
fields:
  title: "h2 a"              # Text content of matched element
  link: "h2 a@href"          # @attr syntax extracts an attribute
  description: ".excerpt"    # Optional: item description
  pubDate: "time@datetime"   # Optional: publication date
  author: ".author-name"     # Optional: author
  category: ".tag:first"     # Optional: category

# Feed metadata
feed:
  title: "My Site - Latest Posts"
  link: "https://example.com/blog"
  description: "Latest posts from My Site"
  language: en

# Optional settings
cache:
  ttl: 300           # Cache duration in seconds (default: 300)
delay: 1000          # Delay between requests in ms (default: 1000)
userAgent: "Custom/1.0"  # Override user-agent (default: rotating)
```

### Selector Syntax

Fields support three extraction modes:

| Syntax | Example | Behavior |
|--------|---------|----------|
| `selector` | `h2 a` | Extracts text content |
| `selector@attr` | `a.link@href` | Extracts an HTML attribute |
| `selector\|html` | `.content\|html` | Extracts inner HTML |

Use `&` as the selector to reference the item element itself: `&@data-id`.

### Dynamic (JavaScript) Pages

For pages that require JavaScript rendering:

```yaml
dynamic: true
waitFor: ".loaded-content"  # Wait for this selector before extracting
```

This uses Puppeteer with headless Chrome. Requires Chrome/Chromium installed on the system.

## Plugin System

### YAML Plugins

Drop additional `.yaml` route files into the `plugins/` directory. They follow the same format as routes and are loaded on startup.

### JavaScript Plugins

Create a JS module that exports a `RoutePlugin` interface:

```javascript
// plugins/my-plugin/index.js
module.exports = {
  name: 'my-plugin',
  routes: [
    {
      name: 'Custom Feed',
      url: 'https://example.com',
      itemSelector: '.item',
      fields: { title: 'h3', link: 'a@href' },
      feed: {
        title: 'Custom Feed',
        link: 'https://example.com',
        description: 'A custom feed',
      },
    },
  ],
  async setup() {
    console.log('Plugin initialized');
  },
  async teardown() {
    console.log('Plugin cleaned up');
  },
};
```

### Hot Reload

Routes in the `routes/` directory are watched for changes. Modifying or adding a YAML file automatically updates the available feeds without restarting the server.

## Configuration

Global settings in `config.yaml`:

```yaml
server:
  port: 3000
  host: "0.0.0.0"

cache:
  enabled: true
  defaultTtl: 300      # Default cache TTL in seconds

antiScrape:
  rotateUserAgent: true
  defaultDelay: 1000   # Default delay between requests (ms)

routesDir: "./routes"
pluginsDir: "./plugins"
```

## Deployment

### Standalone

```bash
npm install
npm run build
NODE_ENV=production npm start
```

### Docker

```dockerfile
FROM node:20-slim

# Install Chrome for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist/ ./dist/
COPY routes/ ./routes/
COPY config.yaml ./

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

Build and run:

```bash
docker build -t feedsmith .
docker run -p 3000:3000 feedsmith
```

### systemd Service

```ini
[Unit]
Description=FeedSmith RSS Feed Generator
After=network.target

[Service]
Type=simple
User=feedsmith
WorkingDirectory=/opt/feedsmith
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Reverse Proxy (nginx)

```nginx
server {
    listen 80;
    server_name feeds.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_valid 200 5m;
    }
}
```

## Architecture

```
src/
├── index.ts           # HTTP server & request routing
├── config/
│   ├── types.ts       # TypeScript interfaces
│   └── loader.ts      # YAML config loading & validation
├── fetcher/
│   ├── index.ts       # Fetcher factory (static vs dynamic)
│   ├── static.ts      # Node.js HTTP/HTTPS fetcher
│   └── dynamic.ts     # Puppeteer-based fetcher
├── parser/
│   └── index.ts       # Cheerio HTML parsing & field extraction
├── feed/
│   └── index.ts       # RSS 2.0 XML generation
├── cache/
│   ├── index.ts       # In-memory request cache with TTL
│   └── anti-scrape.ts # User-agent rotation & delay utility
└── plugins/
    └── loader.ts      # Plugin loading, route watching
```

## Included Route Examples

| Route | Source | Type |
|-------|--------|------|
| `hackernews` | Hacker News front page | Static |
| `github-trending` | GitHub Trending repos | Static |
| `producthunt` | Product Hunt homepage | Dynamic (JS) |
| `reddit-programming` | r/programming | Static |
| `devto` | Dev.to latest | Static |
| `lobsters` | Lobste.rs | Static |

## License

MIT
