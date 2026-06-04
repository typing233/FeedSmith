import express from 'express';
import { loadRoutes, loadPlugins } from '../config/loader';
import { fetchPage } from '../fetcher';
import { parseItems } from '../parser';
import { buildFeed } from '../feed';
import { RouteConfig } from '../types';

export function createServer(port: number = 3000) {
  const app = express();
  const routes = loadRoutes();

  app.get('/', (_req, res) => {
    const routeList = Array.from(routes.keys()).map(name => ({
      name,
      url: `/feed/${name}`,
      source: routes.get(name)!.url,
    }));
    res.json({
      name: 'FeedSmith',
      version: '1.0.0',
      routes: routeList,
    });
  });

  app.get('/feed/:name', async (req, res) => {
    const { name } = req.params;
    const config = routes.get(name);

    if (!config) {
      res.status(404).json({ error: `Route '${name}' not found` });
      return;
    }

    try {
      const html = await fetchPage(config);
      let items = parseItems(html, config);

      const plugins = await loadPlugins();
      const plugin = plugins.get(name);
      if (plugin?.transform) {
        items = plugin.transform(items);
      }

      const xml = buildFeed(config, items);
      res.set('Content-Type', 'application/rss+xml; charset=utf-8');
      res.send(xml);
    } catch (err: any) {
      console.error(`Error generating feed for '${name}':`, err.message);
      res.status(500).json({ error: 'Failed to generate feed', detail: err.message });
    }
  });

  app.get('/feed/:name/json', async (req, res) => {
    const { name } = req.params;
    const config = routes.get(name);

    if (!config) {
      res.status(404).json({ error: `Route '${name}' not found` });
      return;
    }

    try {
      const html = await fetchPage(config);
      const items = parseItems(html, config);
      res.json({ route: name, itemCount: items.length, items });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch', detail: err.message });
    }
  });

  app.post('/routes/reload', (_req, res) => {
    const newRoutes = loadRoutes();
    routes.clear();
    for (const [key, value] of newRoutes) {
      routes.set(key, value);
    }
    res.json({ message: 'Routes reloaded', count: routes.size });
  });

  const server = app.listen(port, () => {
    console.log(`FeedSmith running at http://localhost:${port}`);
    console.log(`Available routes:`);
    for (const [name, config] of routes) {
      console.log(`  /feed/${name} -> ${config.url}`);
    }
  });

  return server;
}
