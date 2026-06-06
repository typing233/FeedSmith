import * as http from 'http';
import { loadAppConfig, loadAllRoutes } from './config/loader';
import { AppConfig, RouteConfig } from './config/types';
import { FetcherFactory } from './fetcher';
import { parseHtml } from './parser';
import { buildFeed } from './feed';
import { PluginLoader } from './plugins/loader';

class FeedSmith {
  private config: AppConfig;
  private routes: Map<string, RouteConfig>;
  private fetcher: FetcherFactory;
  private pluginLoader: PluginLoader;
  private server: http.Server | null = null;

  constructor() {
    this.config = loadAppConfig();
    this.routes = loadAllRoutes(this.config.routesDir);
    this.fetcher = new FetcherFactory(this.config);
    this.pluginLoader = new PluginLoader(this.routes);
  }

  async start(): Promise<void> {
    if (this.config.pluginsDir) {
      await this.pluginLoader.loadPluginsDir(this.config.pluginsDir);
      this.routes = this.pluginLoader.getRoutes();
    }

    this.pluginLoader.watchRoutes(this.config.routesDir, () => {
      console.log('[FeedSmith] Routes reloaded');
    });

    this.server = http.createServer((req, res) => this.handleRequest(req, res));
    this.server.listen(this.config.server.port, this.config.server.host, () => {
      console.log(`[FeedSmith] Server running at http://${this.config.server.host}:${this.config.server.port}`);
      console.log(`[FeedSmith] Loaded ${this.routes.size} route(s):`);
      for (const [name] of this.routes) {
        console.log(`  - /feed/${name}`);
      }
    });
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const url = req.url ?? '/';

    if (url === '/' || url === '/index') {
      this.serveIndex(res);
      return;
    }

    if (url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', routes: this.routes.size }));
      return;
    }

    const feedMatch = url.match(/^\/feed\/([a-z0-9_-]+)$/);
    if (feedMatch) {
      await this.serveFeed(feedMatch[1], res);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }

  private serveIndex(res: http.ServerResponse): void {
    const routeList = Array.from(this.routes.entries()).map(([name, route]) => ({
      name,
      path: `/feed/${name}`,
      description: route.description ?? route.feed.title,
      source: route.url,
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ feeds: routeList }, null, 2));
  }

  private async serveFeed(name: string, res: http.ServerResponse): Promise<void> {
    const route = this.routes.get(name);
    if (!route) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`Feed "${name}" not found`);
      return;
    }

    try {
      const html = await this.fetcher.fetch(route);
      const items = parseHtml(html, route);
      const xml = buildFeed(route, items);

      res.writeHead(200, {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': `public, max-age=${route.cache?.ttl ?? this.config.cache.defaultTtl}`,
      });
      res.end(xml);
    } catch (err) {
      console.error(`[FeedSmith] Error generating feed "${name}":`, err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Error generating feed: ${(err as Error).message}`);
    }
  }

  async stop(): Promise<void> {
    await this.fetcher.close();
    await this.pluginLoader.teardownAll();
    if (this.server) {
      this.server.close();
    }
  }
}

const app = new FeedSmith();
app.start().catch(err => {
  console.error('[FeedSmith] Fatal error:', err);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('\n[FeedSmith] Shutting down...');
  await app.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await app.stop();
  process.exit(0);
});
