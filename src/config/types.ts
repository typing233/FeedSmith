export interface RouteFieldMapping {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  author?: string;
  category?: string;
  guid?: string;
}

export interface RouteConfig {
  name: string;
  description?: string;
  url: string;
  dynamic?: boolean;
  waitFor?: string;
  itemSelector: string;
  fields: RouteFieldMapping;
  feed: {
    title: string;
    link: string;
    description: string;
    language?: string;
  };
  cache?: {
    ttl: number; // seconds
  };
  delay?: number; // ms between requests
  userAgent?: string;
}

export interface AppConfig {
  server: {
    port: number;
    host: string;
  };
  cache: {
    enabled: boolean;
    defaultTtl: number;
  };
  antiScrape: {
    rotateUserAgent: boolean;
    defaultDelay: number;
  };
  routesDir: string;
  pluginsDir?: string;
}
