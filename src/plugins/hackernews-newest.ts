import { PluginRoute, FeedItem } from '../types';

const plugin: PluginRoute = {
  name: 'hackernews-newest',
  config: {
    name: 'hackernews-newest',
    url: 'https://news.ycombinator.com/newest',
    dynamic: false,
    cache: 180,
    delay: 0,
    feed: {
      title: 'Hacker News - Newest',
      description: 'Newest submissions on Hacker News',
      link: 'https://news.ycombinator.com',
      language: 'en',
    },
    selectors: {
      item: '.athing',
      fields: {
        title: '.titleline > a',
        link: '.titleline > a | href',
        description: '.titleline > a',
      },
    },
  },
  transform(items: FeedItem[]): FeedItem[] {
    return items.filter(item => {
      if (!item.title || !item.link) return false;
      if (item.title.toLowerCase().startsWith('tell hn:')) return false;
      return true;
    });
  },
};

export = plugin;
