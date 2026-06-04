import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

export function getCached(key: string): string | undefined {
  return cache.get<string>(key);
}

export function setCache(key: string, html: string, ttl?: number): void {
  if (ttl) {
    cache.set(key, html, ttl);
  } else {
    cache.set(key, html);
  }
}

export function clearCache(): void {
  cache.flushAll();
}
