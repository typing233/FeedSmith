"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestCache = void 0;
class RequestCache {
    constructor() {
        this.store = new Map();
    }
    get(url) {
        const entry = this.store.get(url);
        if (!entry)
            return null;
        if (Date.now() - entry.timestamp > entry.ttl * 1000) {
            this.store.delete(url);
            return null;
        }
        return entry.data;
    }
    set(url, data, ttl) {
        this.store.set(url, { data, timestamp: Date.now(), ttl });
    }
    clear() {
        this.store.clear();
    }
    size() {
        return this.store.size;
    }
    prune() {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now - entry.timestamp > entry.ttl * 1000) {
                this.store.delete(key);
            }
        }
    }
}
exports.RequestCache = RequestCache;
//# sourceMappingURL=index.js.map