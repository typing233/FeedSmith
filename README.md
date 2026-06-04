# FeedSmith

A configurable RSS feed generator that scrapes web pages and serves them as subscribable RSS 2.0 feeds. Supports both static HTML and JavaScript-rendered dynamic pages via headless browser.

## Features

- **YAML-based route configuration** — define target URL, CSS selectors, and field mappings
- **Static & dynamic fetching** — built-in HTTP client for static pages, Puppeteer for JS-rendered content
- **Anti-detection** — user-agent rotation, configurable request delays, response caching
- **Plugin architecture** — extend routes with custom transform logic, or register entirely new routes via plugins
- **RSS 2.0 compliant** — generates valid XML feeds consumable by any RSS reader
- **Hot reload** — reload route configs without restarting the server

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
| `GET /` | List all available routes |
| `GET /feed/:name` | Get RSS XML feed for a route |
| `GET /feed/:name/json` | Get parsed items as JSON (for debugging) |
| `POST /routes/reload` | Hot-reload route configurations |

## Configuration

### Route File Structure

Routes are defined as YAML files in the `routes/` directory. Each file defines one feed source:

```yaml
name: example-site          # Unique route identifier (used in URL)
url: https://example.com    # Target page to scrape
dynamic: false              # Set true for JS-rendered pages (uses Puppeteer)
waitFor: ".content"         # CSS selector to wait for (dynamic mode only)
cache: 300                  # Cache TTL in seconds (default: 600)
delay: 1000                 # Request delay in ms (anti-rate-limit)

feed:
  title: Example Feed       # RSS feed title
  description: Latest posts # RSS feed description
  link: https://example.com # Site homepage URL
  language: en              # Feed language code

selectors:
  item: ".post-item"        # CSS selector for each item container
  fields:
    title: "h2 a"           # Selector for item title (text content)
    link: "h2 a | href"    # Selector with attribute extraction (pipe syntax)
    description: "p.summary"
    pubDate: "time | datetime"
    author: ".author-name"
    category: ".tag"
```

### Selector Syntax

Fields support several extraction patterns:

| Pattern | Example | Behavior |
|---------|---------|----------|
| Simple selector | `h2 a` | Extracts text content |
| Attribute pipe | `a.link \| href` | Extracts specified attribute |
| Self reference | `&` | References the item container itself |
| Attribute prefix | `@data-id` | Extracts attribute from item container |

### Adding a New Route

1. Create a new YAML file in `routes/`:

```yaml
name: my-site
url: https://my-site.com/articles
dynamic: false
cache: 300

feed:
  title: My Site Articles
  description: Latest articles from My Site
  link: https://my-site.com

selectors:
  item: "article.post"
  fields:
    title: "h2.title a"
    link: "h2.title a | href"
    description: "p.excerpt"
    pubDate: "time.published | datetime"
    author: "span.author"
```

2. Test with the JSON endpoint:
```bash
curl http://localhost:3000/feed/my-site/json
```

3. If the server is already running, hot-reload:
```bash
curl -X POST http://localhost:3000/routes/reload
```

4. Subscribe to `http://localhost:3000/feed/my-site` in your RSS reader.

### Dynamic Pages (JavaScript Rendering)

For sites that require JavaScript execution, set `dynamic: true`:

```yaml
name: spa-site
url: https://spa-example.com/feed
dynamic: true
waitFor: ".article-list"   # Wait for this element before extracting
cache: 600
delay: 2000
```

This launches a headless Chromium instance via Puppeteer to fully render the page before extraction.

## Plugin System

Plugins live in `src/plugins/` and are compiled to `dist/plugins/`. They can either:
1. **Hook into an existing YAML route** — add a `transform` function to filter/modify items
2. **Register a new route** — if no YAML route matches the plugin's `name`, it becomes a standalone route

### Creating a Plugin

```typescript
// src/plugins/my-custom-feed.ts
import { PluginRoute, FeedItem } from '../types';

const plugin: PluginRoute = {
  name: 'my-custom-feed',
  config: {
    name: 'my-custom-feed',
    url: 'https://example.com/articles',
    dynamic: false,
    cache: 300,
    delay: 0,
    feed: {
      title: 'My Custom Feed',
      description: 'Articles from example.com',
      link: 'https://example.com',
      language: 'en',
    },
    selectors: {
      item: 'article.post',
      fields: {
        title: 'h2 a',
        link: 'h2 a | href',
        description: 'p.summary',
      },
    },
  },
  transform(items: FeedItem[]): FeedItem[] {
    // Optional: filter, enrich, or modify items
    return items.filter(item => !item.title.includes('[Sponsored]'));
  },
};

export = plugin;
```

After creating a plugin, rebuild (`npm run build`) and restart the server. The plugin will be auto-loaded from `dist/plugins/` and its route will appear in the route list.

### Plugin Loading Behavior

- Plugins are loaded from the compiled `dist/plugins/` directory at startup
- If a plugin's `name` matches an existing YAML route, the plugin's `transform` function hooks into that route
- If no matching YAML route exists, the plugin's `config` is registered as a new route
- Hot-reload (`POST /routes/reload`) reloads both YAML routes and plugins

## Anti-Detection Features

### User-Agent Rotation
Each request uses a different browser user-agent string from a built-in pool, cycling through Chrome, Firefox, Safari, and Edge identities.

### Request Delays
Configure per-route delays to avoid rate limiting:
```yaml
delay: 2000  # Wait 2 seconds before fetching
```

### Response Caching
Responses are cached in memory to reduce request frequency:
```yaml
cache: 600  # Cache for 10 minutes
```

## Deployment

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |

### Docker

```dockerfile
FROM node:20-slim

# Puppeteer dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libgbm1 \
    libnss3 \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist/ ./dist/
COPY routes/ ./routes/

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

Build and run:
```bash
docker build -t feedsmith .
docker run -p 3000:3000 -v ./routes:/app/routes feedsmith
```

### Systemd Service

```ini
[Unit]
Description=FeedSmith RSS Generator
After=network.target

[Service]
Type=simple
User=feedsmith
WorkingDirectory=/opt/feedsmith
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name feeds.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Project Structure

```
FeedSmith/
├── routes/              # YAML route configurations
│   ├── hackernews.yaml
│   ├── github-trending.yaml
│   ├── dev-to.yaml
│   ├── cnblogs.yaml
│   └── sspai.yaml
├── src/
│   ├── index.ts         # Entry point
│   ├── types.ts         # TypeScript interfaces
│   ├── config/
│   │   └── loader.ts    # YAML config & plugin loader
│   ├── fetcher/
│   │   ├── index.ts     # Unified fetch interface
│   │   ├── static.ts    # HTTP-based static fetcher
│   │   ├── dynamic.ts   # Puppeteer-based dynamic fetcher
│   │   ├── cache.ts     # In-memory response cache
│   │   └── user-agents.ts # UA rotation pool
│   ├── parser/
│   │   └── index.ts     # Cheerio-based HTML parser
│   ├── feed/
│   │   └── index.ts     # RSS 2.0 XML generator
│   ├── server/
│   │   └── index.ts     # Express HTTP server
│   └── plugins/         # Plugin-based route extensions
│       ├── echojs.ts            # Registers new /feed/echojs route
│       └── hackernews-newest.ts # Registers new /feed/hackernews-newest route
├── package.json
├── tsconfig.json
└── Dockerfile
```

## License

MIT
