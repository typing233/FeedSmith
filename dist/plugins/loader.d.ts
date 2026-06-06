import * as fs from 'fs';
import { RouteConfig } from '../config/types';
export interface RoutePlugin {
    name: string;
    routes: RouteConfig[];
    setup?(): Promise<void>;
    teardown?(): Promise<void>;
}
export declare class PluginLoader {
    private plugins;
    private routes;
    constructor(routes: Map<string, RouteConfig>);
    loadPluginsDir(pluginsDir: string): Promise<void>;
    private loadPluginDirectory;
    private loadRouteFile;
    private loadJsPlugin;
    getRoutes(): Map<string, RouteConfig>;
    teardownAll(): Promise<void>;
    watchRoutes(routesDir: string, onChange: () => void): fs.FSWatcher | null;
}
//# sourceMappingURL=loader.d.ts.map