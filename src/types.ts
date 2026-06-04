export interface RouteConfig {
  name: string;
  url: string;
  dynamic?: boolean;
  waitFor?: string;
  cache?: number;
  delay?: number;
  feed: FeedMeta;
  selectors: SelectorConfig;
}

export interface FeedMeta {
  title: string;
  description: string;
  link: string;
  language?: string;
}

export interface SelectorConfig {
  item: string;
  fields: FieldMapping;
}

export interface FieldMapping {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  author?: string;
  category?: string;
  [key: string]: string | undefined;
}

export interface FeedItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  author?: string;
  category?: string;
}

export interface PluginRoute {
  name: string;
  config: RouteConfig;
  transform?: (items: FeedItem[]) => FeedItem[];
}
