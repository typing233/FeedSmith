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
exports.DynamicFetcher = void 0;
const anti_scrape_1 = require("../cache/anti-scrape");
const cache_1 = require("../cache");
class DynamicFetcher {
    constructor(config) {
        this.browser = null;
        this.config = config;
        this.cache = new cache_1.RequestCache();
    }
    async fetch(url, options = {}) {
        if (this.config.cache.enabled) {
            const cached = this.cache.get(url);
            if (cached)
                return cached;
        }
        const delayMs = options.delayMs ?? this.config.antiScrape.defaultDelay;
        if (delayMs > 0)
            await (0, anti_scrape_1.delay)(delayMs);
        const html = await this.renderPage(url, options);
        if (this.config.cache.enabled) {
            this.cache.set(url, html, options.cacheTtl ?? this.config.cache.defaultTtl);
        }
        return html;
    }
    async renderPage(url, options) {
        const puppeteer = await Promise.resolve().then(() => __importStar(require('puppeteer')));
        if (!this.browser) {
            this.browser = await puppeteer.default.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            });
        }
        const page = await this.browser.newPage();
        const ua = this.config.antiScrape.rotateUserAgent
            ? (0, anti_scrape_1.getRotatingUserAgent)()
            : (options.userAgent ?? 'FeedSmith/1.0');
        await page.setUserAgent(ua);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        if (options.waitFor) {
            await page.waitForSelector(options.waitFor, { timeout: 10000 });
        }
        const html = await page.content();
        await page.close();
        return html;
    }
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}
exports.DynamicFetcher = DynamicFetcher;
//# sourceMappingURL=dynamic.js.map