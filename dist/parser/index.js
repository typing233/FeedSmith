"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseHtml = parseHtml;
const cheerio = __importStar(require("cheerio"));
function parseHtml(html, route) {
    const $ = cheerio.load(html);
    const items = [];
    $(route.itemSelector).each((_, element) => {
        const item = extractItem($, $(element), route.fields, route.url);
        if (item.title && item.link) {
            items.push(item);
        }
    });
    return items;
}
function extractItem($, el, fields, baseUrl) {
    const item = {
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
    }
    else {
        item.guid = item.link;
    }
    return item;
}
function extractField(el, selector, defaultAttr, allowHtml) {
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
        if (mode === 'html')
            return (target.html() ?? '').trim();
        return (target.text() ?? '').trim();
    }
    // Default: try attr if specified, fall back to text
    const target = selector === '&' ? el : el.find(selector);
    if (defaultAttr && defaultAttr !== 'text') {
        const attrVal = target.attr(defaultAttr);
        if (attrVal)
            return attrVal.trim();
    }
    return allowHtml
        ? (target.html() ?? '').trim()
        : (target.text() ?? '').trim();
}
function resolveUrl(url, baseUrl) {
    if (!url)
        return '';
    if (url.startsWith('http://') || url.startsWith('https://'))
        return url;
    try {
        return new URL(url, baseUrl).href;
    }
    catch {
        return url;
    }
}
//# sourceMappingURL=index.js.map