import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import { getRandomUserAgent } from './user-agents';
import { getCached, setCache } from './cache';
import { RouteConfig } from '../types';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchStatic(config: RouteConfig): Promise<string> {
  const cacheKey = `static:${config.url}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (config.delay) {
    await delay(config.delay);
  }

  const html = await httpGet(config.url);
  setCache(cacheKey, html, config.cache || 600);
  return html;
}

function httpGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive',
      },
    };

    const req = client.request(options, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(httpGet(res.headers.location));
        return;
      }

      let data = '';
      res.setEncoding('utf-8');
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error(`Request timeout: ${url}`));
    });
    req.end();
  });
}
