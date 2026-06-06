"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const http = __importStar(require("http"));
const loader_1 = require("./config/loader");
const fetcher_1 = require("./fetcher");
const parser_1 = require("./parser");
const feed_1 = require("./feed");
const loader_2 = require("./plugins/loader");
class FeedSmith {
    constructor() {
        this.server = null;
        this.config = (0, loader_1.loadAppConfig)();
        this.routes = (0, loader_1.loadAllRoutes)(this.config.routesDir);
        this.fetcher = new fetcher_1.FetcherFactory(this.config);
        this.pluginLoader = new loader_2.PluginLoader(this.routes);
    }
    async start() {
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
    async handleRequest(req, res) {
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
    serveIndex(res) {
        const routeList = Array.from(this.routes.entries()).map(([name, route]) => ({
            name,
            path: `/feed/${name}`,
            description: route.description ?? route.feed.title,
            source: route.url,
        }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ feeds: routeList }, null, 2));
    }
    async serveFeed(name, res) {
        const route = this.routes.get(name);
        if (!route) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end(`Feed "${name}" not found`);
            return;
        }
        try {
            const html = await this.fetcher.fetch(route);
            const items = (0, parser_1.parseHtml)(html, route);
            const xml = (0, feed_1.buildFeed)(route, items);
            res.writeHead(200, {
                'Content-Type': 'application/rss+xml; charset=utf-8',
                'Cache-Control': `public, max-age=${route.cache?.ttl ?? this.config.cache.defaultTtl}`,
            });
            res.end(xml);
        }
        catch (err) {
            console.error(`[FeedSmith] Error generating feed "${name}":`, err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end(`Error generating feed: ${err.message}`);
        }
    }
    async stop() {
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
//# sourceMappingURL=index.js.map