import { AppConfig } from '../config/types';
export interface FetchOptions {
    userAgent?: string;
    delayMs?: number;
    cacheTtl?: number;
}
export declare class StaticFetcher {
    private cache;
    private config;
    constructor(config: AppConfig);
    fetch(url: string, options?: FetchOptions): Promise<string>;
    private request;
}
//# sourceMappingURL=static.d.ts.map