import RSS from 'rss';
import { RouteConfig, FeedItem } from '../types';

function parseDate(raw?: string): Date {
  if (!raw) return new Date();
  const trimmed = raw.trim().split('\n')[0].trim();
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function buildFeed(config: RouteConfig, items: FeedItem[]): string {
  const feed = new RSS({
    title: config.feed.title,
    description: config.feed.description,
    feed_url: `${config.feed.link}/feed/${config.name}`,
    site_url: config.feed.link,
    language: config.feed.language || 'en',
    pubDate: new Date(),
    ttl: Math.floor((config.cache || 600) / 60),
    generator: 'FeedSmith',
  });

  for (const item of items) {
    feed.item({
      title: item.title,
      url: item.link,
      description: item.description || '',
      date: parseDate(item.pubDate),
      author: item.author || '',
      categories: item.category ? [item.category] : [],
    });
  }

  return feed.xml({ indent: true });
}
