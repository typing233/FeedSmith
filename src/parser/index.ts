import * as cheerio from 'cheerio';
import { Element } from 'domhandler';
import { URL } from 'url';
import { RouteConfig, FeedItem, SelectorConfig } from '../types';

export function parseItems(html: string, config: RouteConfig): FeedItem[] {
  const $ = cheerio.load(html);
  const { selectors } = config;
  const items: FeedItem[] = [];
  const baseUrl = new URL(config.url);

  $(selectors.item).each((_, el) => {
    const item = extractItem($, el as Element, selectors, baseUrl);
    if (item.title && item.link) {
      items.push(item);
    }
  });

  return items;
}

function extractItem(
  $: cheerio.CheerioAPI,
  el: Element,
  selectors: SelectorConfig,
  baseUrl: URL
): FeedItem {
  const $el = $(el);
  const fields = selectors.fields;

  const title = extractField($, $el, fields.title);
  const rawLink = extractField($, $el, fields.link, 'href');
  const link = resolveUrl(rawLink, baseUrl);
  const description = fields.description ? extractField($, $el, fields.description) : undefined;
  const pubDate = fields.pubDate ? extractField($, $el, fields.pubDate) : undefined;
  const author = fields.author ? extractField($, $el, fields.author) : undefined;
  const category = fields.category ? extractField($, $el, fields.category) : undefined;

  return { title, link, description, pubDate, author, category };
}

function extractField(
  $: cheerio.CheerioAPI,
  $el: cheerio.Cheerio<Element>,
  selector: string,
  attr?: string
): string {
  if (selector.startsWith('@')) {
    return $el.attr(selector.slice(1)) || '';
  }

  const parts = selector.split('|').map(s => s.trim());
  const cssSelector = parts[0];
  const attribute = parts[1] || attr;

  const target = cssSelector === '&' ? $el : $el.find(cssSelector);

  if (attribute) {
    return (target.attr(attribute) || '').trim();
  }
  return (target.text() || '').trim();
}

function resolveUrl(url: string, base: URL): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('//')) return `${base.protocol}${url}`;
  if (url.startsWith('/')) return `${base.origin}${url}`;
  return `${base.origin}/${url}`;
}
