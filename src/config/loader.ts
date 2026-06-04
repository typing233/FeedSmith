import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { glob } from 'glob';
import { RouteConfig, PluginRoute } from '../types';

const DEFAULT_ROUTES_DIR = path.resolve(process.cwd(), 'routes');
const PLUGINS_DIR = path.resolve(process.cwd(), 'src/plugins');

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

export async function loadPlugins(): Promise<Map<string, PluginRoute>> {
  const plugins = new Map<string, PluginRoute>();

  if (!fs.existsSync(PLUGINS_DIR)) {
    return plugins;
  }

  const files = await glob('*.{js,ts}', { cwd: PLUGINS_DIR });

  for (const file of files) {
    try {
      const pluginPath = path.join(PLUGINS_DIR, file);
      const plugin = require(pluginPath) as PluginRoute;
      if (plugin && plugin.name && plugin.config) {
        plugins.set(plugin.name, plugin);
      }
    } catch (err) {
      console.warn(`Failed to load plugin ${file}:`, err);
    }
  }

  return plugins;
}
