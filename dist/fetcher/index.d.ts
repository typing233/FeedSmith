import { AppConfig, RouteConfig } from '../config/types';
export declare class FetcherFactory {
    private staticFetcher;
    private dynamicFetcher;
    constructor(config: AppConfig);
    fetch(route: RouteConfig): Promise<string>;
    close(): Promise<void>;
}
export { StaticFetcher } from './static';
export { DynamicFetcher } from './dynamic';
//# sourceMappingURL=index.d.ts.map