import { PluginRoute, FeedItem } from '../types';

const plugin: PluginRoute = {
  name: 'echojs',
  config: {
    name: 'echojs',
    url: 'https://www.echojs.com/',
    dynamic: false,
    cache: 300,
    delay: 0,
    feed: {
      title: 'Echo JS - JavaScript News',
      description: 'JavaScript news and community articles from Echo JS',
      link: 'https://www.echojs.com',
      language: 'en',
    },
    selectors: {
      item: 'article[data-news-id]',
      fields: {
        title: 'h2 a',
        link: 'h2 a | href',
        description: 'h2 a',
        author: 'username a',
      },
    },
  },
  transform(items: FeedItem[]): FeedItem[] {
    return items
      .filter(item => item.title && item.title.length > 0)
      .map(item => ({
        ...item,
        link: item.link.startsWith('http') ? item.link : `https://www.echojs.com${item.link}`,
      }));
  },
};

export = plugin;
