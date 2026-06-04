import puppeteer, { Browser } from 'puppeteer';
import { getRandomUserAgent } from './user-agents';
import { getCached, setCache } from './cache';
import { RouteConfig } from '../types';

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.connected) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
  }
  return browserInstance;
}

export async function fetchDynamic(config: RouteConfig): Promise<string> {
  const cacheKey = `dynamic:${config.url}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (config.delay) {
    await new Promise(resolve => setTimeout(resolve, config.delay));
  }

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent(getRandomUserAgent());
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(config.url, { waitUntil: 'networkidle2', timeout: 30000 });

    if (config.waitFor) {
      await page.waitForSelector(config.waitFor, { timeout: 10000 });
    }

    const html = await page.content();
    setCache(cacheKey, html, config.cache || 600);
    return html;
  } finally {
    await page.close();
  }
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
