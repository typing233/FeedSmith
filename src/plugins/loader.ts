import * as fs from 'fs';
import * as path from 'path';
import { RouteConfig } from '../config/types';
import { loadRouteConfig } from '../config/loader';

export interface RoutePlugin {
  name: string;
  routes: RouteConfig[];
  setup?(): Promise<void>;
  teardown?(): Promise<void>;
}

export class PluginLoader {
  private plugins: Map<string, RoutePlugin> = new Map();
  private routes: Map<string, RouteConfig>;

  constructor(routes: Map<string, RouteConfig>) {
    this.routes = routes;
  }

  async loadPluginsDir(pluginsDir: string): Promise<void> {
    if (!fs.existsSync(pluginsDir)) return;

    const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(pluginsDir, entry.name);

      if (entry.isDirectory()) {
        await this.loadPluginDirectory(fullPath);
      } else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
        this.loadRouteFile(fullPath);
      } else if (entry.name.endsWith('.js')) {
        await this.loadJsPlugin(fullPath);
      }
    }
  }

  private async loadPluginDirectory(dir: string): Promise<void> {
    const indexJs = path.join(dir, 'index.js');
    const indexTs = path.join(dir, 'index.ts');

    if (fs.existsSync(indexJs)) {
      await this.loadJsPlugin(indexJs);
      return;
    }

    // Load all YAML files in the directory as routes
    const files = fs.readdirSync(dir).filter(
      f => f.endsWith('.yaml') || f.endsWith('.yml')
    );
    for (const file of files) {
      this.loadRouteFile(path.join(dir, file));
    }
  }

  private loadRouteFile(filePath: string): void {
    const config = loadRouteConfig(filePath);
    const routeName = path.basename(filePath, path.extname(filePath));
    this.routes.set(routeName, config);
  }

  private async loadJsPlugin(filePath: string): Promise<void> {
    const plugin = require(path.resolve(filePath)) as RoutePlugin;
    if (plugin.setup) await plugin.setup();
    this.plugins.set(plugin.name, plugin);

    for (const route of plugin.routes) {
      const routeName = route.name.toLowerCase().replace(/\s+/g, '-');
      this.routes.set(routeName, route);
    }
  }

  getRoutes(): Map<string, RouteConfig> {
    return this.routes;
  }

  async teardownAll(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.teardown) await plugin.teardown();
    }
  }

  watchRoutes(routesDir: string, onChange: () => void): fs.FSWatcher | null {
    if (!fs.existsSync(routesDir)) return null;
    return fs.watch(routesDir, (event, filename) => {
      if (filename && (filename.endsWith('.yaml') || filename.endsWith('.yml'))) {
        const filePath = path.join(routesDir, filename);
        if (fs.existsSync(filePath)) {
          try {
            const config = loadRouteConfig(filePath);
            const routeName = path.basename(filename, path.extname(filename));
            this.routes.set(routeName, config);
            onChange();
          } catch (err) {
            console.error(`Failed to reload route ${filename}:`, err);
          }
        }
      }
    });
  }
}
