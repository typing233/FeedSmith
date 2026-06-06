import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { getRotatingUserAgent, delay } from '../cache/anti-scrape';
import { RequestCache } from '../cache';
import { AppConfig } from '../config/types';

export interface FetchOptions {
  userAgent?: string;
  delayMs?: number;
  cacheTtl?: number;
}

export class StaticFetcher {
  private cache: RequestCache;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.cache = new RequestCache();
  }

  async fetch(url: string, options: FetchOptions = {}): Promise<string> {
    if (this.config.cache.enabled) {
      const cached = this.cache.get(url);
      if (cached) return cached;
    }

    const delayMs = options.delayMs ?? this.config.antiScrape.defaultDelay;
    if (delayMs > 0) await delay(delayMs);

    const ua = this.config.antiScrape.rotateUserAgent
      ? getRotatingUserAgent()
      : (options.userAgent ?? 'FeedSmith/1.0');

    const html = await this.request(url, ua);

    if (this.config.cache.enabled) {
      this.cache.set(url, html, options.cacheTtl ?? this.config.cache.defaultTtl);
    }

    return html;
  }

  private request(url: string, userAgent: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const client = parsed.protocol === 'https:' ? https : http;

      const req = client.get(
        {
          hostname: parsed.hostname,
          port: parsed.port,
          path: parsed.pathname + parsed.search,
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            this.request(res.headers.location, userAgent).then(resolve).catch(reject);
            return;
          }

          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            return;
          }

          const chunks: Buffer[] = [];
          res.on('data', chunk => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
          res.on('error', reject);
        }
      );

      req.on('error', reject);
      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error(`Timeout fetching ${url}`));
      });
    });
  }
}
