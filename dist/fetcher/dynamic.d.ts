import { AppConfig } from '../config/types';
import { FetchOptions } from './static';
export declare class DynamicFetcher {
    private cache;
    private config;
    private browser;
    constructor(config: AppConfig);
    fetch(url: string, options?: FetchOptions & {
        waitFor?: string;
    }): Promise<string>;
    private renderPage;
    close(): Promise<void>;
}
//# sourceMappingURL=dynamic.d.ts.map