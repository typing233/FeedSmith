interface CacheEntry {
  data: string;
  timestamp: number;
  ttl: number;
}

export class RequestCache {
  private store = new Map<string, CacheEntry>();

  get(url: string): string | null {
    const entry = this.store.get(url);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl * 1000) {
      this.store.delete(url);
      return null;
    }
    return entry.data;
  }

  set(url: string, data: string, ttl: number): void {
    this.store.set(url, { data, timestamp: Date.now(), ttl });
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.store.delete(key);
      }
    }
  }
}
