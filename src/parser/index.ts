import * as cheerio from 'cheerio';
import { RouteConfig, RouteFieldMapping } from '../config/types';

export interface FeedItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  author?: string;
  category?: string;
  guid?: string;
}

export function parseHtml(html: string, route: RouteConfig): FeedItem[] {
  const $ = cheerio.load(html);
  const items: FeedItem[] = [];

  $(route.itemSelector).each((_, element) => {
    const item = extractItem($, $(element), route.fields, route.url);
    if (item.title && item.link) {
      items.push(item);
    }
  });

  return items;
}

function extractItem(
  $: cheerio.CheerioAPI,
  el: cheerio.Cheerio<any>,
  fields: RouteFieldMapping,
  baseUrl: string
): FeedItem {
  const item: FeedItem = {
    title: extractField(el, fields.title),
    link: resolveUrl(extractField(el, fields.link, 'href'), baseUrl),
  };

  if (fields.description) {
    item.description = extractField(el, fields.description, 'text', true);
  }
  if (fields.pubDate) {
    item.pubDate = extractField(el, fields.pubDate, 'datetime');
  }
  if (fields.author) {
    item.author = extractField(el, fields.author);
  }
  if (fields.category) {
    item.category = extractField(el, fields.category);
  }
  if (fields.guid) {
    item.guid = extractField(el, fields.guid, 'href');
  } else {
    item.guid = item.link;
  }

  return item;
}

function extractField(
  el: cheerio.Cheerio<any>,
  selector: string,
  defaultAttr?: string,
  allowHtml?: boolean
): string {
  // Support "selector@attr" syntax: "a.title@href"
  const attrMatch = selector.match(/^(.+?)@(\w+)$/);
  if (attrMatch) {
    const [, sel, attr] = attrMatch;
    const target = sel === '&' ? el : el.find(sel);
    return (target.attr(attr) ?? '').trim();
  }

  // Support "selector|text" or "selector|html"
  const pipeMatch = selector.match(/^(.+?)\|(\w+)$/);
  if (pipeMatch) {
    const [, sel, mode] = pipeMatch;
    const target = sel === '&' ? el : el.find(sel);
    if (mode === 'html') return (target.html() ?? '').trim();
    return (target.text() ?? '').trim();
  }

  // Default: try attr if specified, fall back to text
  const target = selector === '&' ? el : el.find(selector);
  if (defaultAttr && defaultAttr !== 'text') {
    const attrVal = target.attr(defaultAttr);
    if (attrVal) return attrVal.trim();
  }

  return allowHtml
    ? (target.html() ?? '').trim()
    : (target.text() ?? '').trim();
}

function resolveUrl(url: string, baseUrl: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}
