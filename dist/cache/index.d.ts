export declare class RequestCache {
    private store;
    get(url: string): string | null;
    set(url: string, data: string, ttl: number): void;
    clear(): void;
    size(): number;
    prune(): void;
}
//# sourceMappingURL=index.d.ts.map