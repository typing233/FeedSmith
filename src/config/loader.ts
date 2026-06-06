import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { RouteConfig, AppConfig } from './types';

const DEFAULT_APP_CONFIG: AppConfig = {
  server: { port: 3000, host: '0.0.0.0' },
  cache: { enabled: true, defaultTtl: 300 },
  antiScrape: { rotateUserAgent: true, defaultDelay: 1000 },
  routesDir: path.resolve(process.cwd(), 'routes'),
  pluginsDir: path.resolve(process.cwd(), 'plugins'),
};

export function loadAppConfig(configPath?: string): AppConfig {
  if (configPath && fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = yaml.load(raw) as Partial<AppConfig>;
    return { ...DEFAULT_APP_CONFIG, ...parsed };
  }
  const defaultPath = path.resolve(process.cwd(), 'config.yaml');
  if (fs.existsSync(defaultPath)) {
    const raw = fs.readFileSync(defaultPath, 'utf-8');
    const parsed = yaml.load(raw) as Partial<AppConfig>;
    return { ...DEFAULT_APP_CONFIG, ...parsed };
  }
  return DEFAULT_APP_CONFIG;
}

export function loadRouteConfig(filePath: string): RouteConfig {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const config = yaml.load(raw) as RouteConfig;
  validateRouteConfig(config, filePath);
  return config;
}

export function loadAllRoutes(routesDir: string): Map<string, RouteConfig> {
  const routes = new Map<string, RouteConfig>();
  if (!fs.existsSync(routesDir)) return routes;

  const files = fs.readdirSync(routesDir).filter(
    f => f.endsWith('.yaml') || f.endsWith('.yml')
  );

  for (const file of files) {
    const filePath = path.join(routesDir, file);
    const config = loadRouteConfig(filePath);
    const routeName = path.basename(file, path.extname(file));
    routes.set(routeName, config);
  }
  return routes;
}

function validateRouteConfig(config: RouteConfig, filePath: string): void {
  const required: (keyof RouteConfig)[] = ['name', 'url', 'itemSelector', 'fields', 'feed'];
  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Route config ${filePath} missing required field: ${key}`);
    }
  }
  if (!config.fields.title || !config.fields.link) {
    throw new Error(`Route config ${filePath} must define fields.title and fields.link`);
  }
}

export { RouteConfig, AppConfig } from './types';
