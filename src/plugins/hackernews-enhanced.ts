import { PluginRoute, FeedItem } from '../types';

const plugin: PluginRoute = {
  name: 'hackernews',
  config: {
    name: 'hackernews',
    url: 'https://news.ycombinator.com/',
    dynamic: false,
    cache: 300,
    feed: {
      title: 'Hacker News - Front Page (Enhanced)',
      description: 'Enhanced HN feed with plugin transform',
      link: 'https://news.ycombinator.com',
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
    return items.filter(item => item.title && item.title.length > 0);
  },
};

module.exports = plugin;
