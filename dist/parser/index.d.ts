import { RouteConfig } from '../config/types';
export interface FeedItem {
    title: string;
    link: string;
    description?: string;
    pubDate?: string;
    author?: string;
    category?: string;
    guid?: string;
}
export declare function parseHtml(html: string, route: RouteConfig): FeedItem[];
//# sourceMappingURL=index.d.ts.map