import { StaticFetcher } from './static';
import { DynamicFetcher } from './dynamic';
import { AppConfig, RouteConfig } from '../config/types';

export class FetcherFactory {
  private staticFetcher: StaticFetcher;
  private dynamicFetcher: DynamicFetcher;

  constructor(config: AppConfig) {
    this.staticFetcher = new StaticFetcher(config);
    this.dynamicFetcher = new DynamicFetcher(config);
  }

  async fetch(route: RouteConfig): Promise<string> {
    const options = {
      delayMs: route.delay,
      cacheTtl: route.cache?.ttl,
      userAgent: route.userAgent,
    };

    if (route.dynamic) {
      return this.dynamicFetcher.fetch(route.url, { ...options, waitFor: route.waitFor });
    }
    return this.staticFetcher.fetch(route.url, options);
  }

  async close(): Promise<void> {
    await this.dynamicFetcher.close();
  }
}

export { StaticFetcher } from './static';
export { DynamicFetcher } from './dynamic';
