import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { RouteConfig, PluginRoute } from '../types';

const DEFAULT_ROUTES_DIR = path.resolve(process.cwd(), 'routes');
const PLUGINS_DIR = path.resolve(process.cwd(), 'dist/plugins');

export function loadRoutes(routesDir?: string): Map<string, RouteConfig> {
  const dir = routesDir || DEFAULT_ROUTES_DIR;
  const routes = new Map<string, RouteConfig>();

  if (!fs.existsSync(dir)) {
    console.warn(`Routes directory not found: ${dir}`);
    return routes;
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  for (const file of files) {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const config = yaml.load(content) as RouteConfig;

    if (config && config.name) {
      routes.set(config.name, config);
    }
  }

  return routes;
}

export function loadPlugins(): Map<string, PluginRoute> {
  const plugins = new Map<string, PluginRoute>();

  if (!fs.existsSync(PLUGINS_DIR)) {
    return plugins;
  }

  const files = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'));

  for (const file of files) {
    try {
      const pluginPath = path.resolve(PLUGINS_DIR, file);
      delete require.cache[pluginPath];
      const mod = require(pluginPath);
      const plugin: PluginRoute = mod.default || mod;
      if (plugin && plugin.name && plugin.config) {
        plugins.set(plugin.name, plugin);
        console.log(`  Plugin loaded: ${plugin.name} (${file})`);
      }
    } catch (err: any) {
      console.warn(`  Failed to load plugin ${file}: ${err.message}`);
    }
  }

  return plugins;
}

export function loadAllRoutes(routesDir?: string): {
  routes: Map<string, RouteConfig>;
  plugins: Map<string, PluginRoute>;
} {
  const routes = loadRoutes(routesDir);
  const plugins = loadPlugins();

  for (const [name, plugin] of plugins) {
    if (!routes.has(name)) {
      routes.set(name, plugin.config);
      console.log(`  Plugin registered new route: ${name}`);
    }
  }

  return { routes, plugins };
}
