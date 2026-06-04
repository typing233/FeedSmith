import { RouteConfig } from '../types';
import { fetchStatic } from './static';
import { fetchDynamic } from './dynamic';

export async function fetchPage(config: RouteConfig): Promise<string> {
  if (config.dynamic) {
    return fetchDynamic(config);
  }
  return fetchStatic(config);
}

export { closeBrowser } from './dynamic';
export { clearCache } from './cache';
