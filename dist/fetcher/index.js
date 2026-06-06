"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicFetcher = exports.StaticFetcher = exports.FetcherFactory = void 0;
const static_1 = require("./static");
const dynamic_1 = require("./dynamic");
class FetcherFactory {
    constructor(config) {
        this.staticFetcher = new static_1.StaticFetcher(config);
        this.dynamicFetcher = new dynamic_1.DynamicFetcher(config);
    }
    async fetch(route) {
        const options = {
            delayMs: route.delay,
            cacheTtl: route.cache?.ttl,
            userAgent: route.userAgent,
        };
        if (route.dynamic) {
            return this.dynamicFetcher.fetch(route.url, { ...options, waitFor: route.waitFor });
        }
        return this.staticFetcher.fetch(route.url, options);
    }
    async close() {
        await this.dynamicFetcher.close();
    }
}
exports.FetcherFactory = FetcherFactory;
var static_2 = require("./static");
Object.defineProperty(exports, "StaticFetcher", { enumerable: true, get: function () { return static_2.StaticFetcher; } });
var dynamic_2 = require("./dynamic");
Object.defineProperty(exports, "DynamicFetcher", { enumerable: true, get: function () { return dynamic_2.DynamicFetcher; } });
//# sourceMappingURL=index.js.map