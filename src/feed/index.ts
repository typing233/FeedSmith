import { FeedItem } from '../parser';
import { RouteConfig } from '../config/types';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapCdata(str: string): string {
  if (/<[^>]+>/.test(str)) {
    return `<![CDATA[${str.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
  }
  return escapeXml(str);
}

export function buildFeed(route: RouteConfig, items: FeedItem[]): string {
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(route.feed.title)}</title>`,
    `    <link>${escapeXml(route.feed.link)}</link>`,
    `    <description>${escapeXml(route.feed.description)}</description>`,
  ];

  if (route.feed.language) {
    lines.push(`    <language>${escapeXml(route.feed.language)}</language>`);
  }

  lines.push(`    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`);
  lines.push(`    <generator>FeedSmith v1.0</generator>`);

  for (const item of items) {
    lines.push('    <item>');
    lines.push(`      <title>${wrapCdata(item.title)}</title>`);
    lines.push(`      <link>${escapeXml(item.link)}</link>`);

    if (item.description) {
      lines.push(`      <description>${wrapCdata(item.description)}</description>`);
    }

    if (item.pubDate) {
      const date = normalizeDate(item.pubDate);
      if (date) lines.push(`      <pubDate>${date}</pubDate>`);
    }

    if (item.author) {
      lines.push(`      <author>${escapeXml(item.author)}</author>`);
    }

    if (item.category) {
      lines.push(`      <category>${escapeXml(item.category)}</category>`);
    }

    if (item.guid) {
      lines.push(`      <guid isPermaLink="true">${escapeXml(item.guid)}</guid>`);
    }

    lines.push('    </item>');
  }

  lines.push('  </channel>');
  lines.push('</rss>');

  return lines.join('\n');
}

function normalizeDate(dateStr: string): string | null {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toUTCString();
  } catch {
    return null;
  }
}
