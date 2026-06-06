import { getRotatingUserAgent, delay } from '../cache/anti-scrape';
import { RequestCache } from '../cache';
import { AppConfig } from '../config/types';
import { FetchOptions } from './static';

export class DynamicFetcher {
  private cache: RequestCache;
  private config: AppConfig;
  private browser: any = null;

  constructor(config: AppConfig) {
    this.config = config;
    this.cache = new RequestCache();
  }

  async fetch(url: string, options: FetchOptions & { waitFor?: string } = {}): Promise<string> {
    if (this.config.cache.enabled) {
      const cached = this.cache.get(url);
      if (cached) return cached;
    }

    const delayMs = options.delayMs ?? this.config.antiScrape.defaultDelay;
    if (delayMs > 0) await delay(delayMs);

    const html = await this.renderPage(url, options);

    if (this.config.cache.enabled) {
      this.cache.set(url, html, options.cacheTtl ?? this.config.cache.defaultTtl);
    }

    return html;
  }

  private async renderPage(url: string, options: FetchOptions & { waitFor?: string }): Promise<string> {
    const puppeteer = await import('puppeteer');

    if (!this.browser) {
      this.browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
    }

    const page = await this.browser.newPage();

    const ua = this.config.antiScrape.rotateUserAgent
      ? getRotatingUserAgent()
      : (options.userAgent ?? 'FeedSmith/1.0');

    await page.setUserAgent(ua);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    if (options.waitFor) {
      await page.waitForSelector(options.waitFor, { timeout: 10000 });
    }

    const html = await page.content();
    await page.close();
    return html;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
