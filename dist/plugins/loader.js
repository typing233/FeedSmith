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
exports.PluginLoader = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const loader_1 = require("../config/loader");
class PluginLoader {
    constructor(routes) {
        this.plugins = new Map();
        this.routes = routes;
    }
    async loadPluginsDir(pluginsDir) {
        if (!fs.existsSync(pluginsDir))
            return;
        const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(pluginsDir, entry.name);
            if (entry.isDirectory()) {
                await this.loadPluginDirectory(fullPath);
            }
            else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
                this.loadRouteFile(fullPath);
            }
            else if (entry.name.endsWith('.js')) {
                await this.loadJsPlugin(fullPath);
            }
        }
    }
    async loadPluginDirectory(dir) {
        const indexJs = path.join(dir, 'index.js');
        const indexTs = path.join(dir, 'index.ts');
        if (fs.existsSync(indexJs)) {
            await this.loadJsPlugin(indexJs);
            return;
        }
        // Load all YAML files in the directory as routes
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
        for (const file of files) {
            this.loadRouteFile(path.join(dir, file));
        }
    }
    loadRouteFile(filePath) {
        const config = (0, loader_1.loadRouteConfig)(filePath);
        const routeName = path.basename(filePath, path.extname(filePath));
        this.routes.set(routeName, config);
    }
    async loadJsPlugin(filePath) {
        const plugin = require(path.resolve(filePath));
        if (plugin.setup)
            await plugin.setup();
        this.plugins.set(plugin.name, plugin);
        for (const route of plugin.routes) {
            const routeName = route.name.toLowerCase().replace(/\s+/g, '-');
            this.routes.set(routeName, route);
        }
    }
    getRoutes() {
        return this.routes;
    }
    async teardownAll() {
        for (const plugin of this.plugins.values()) {
            if (plugin.teardown)
                await plugin.teardown();
        }
    }
    watchRoutes(routesDir, onChange) {
        if (!fs.existsSync(routesDir))
            return null;
        return fs.watch(routesDir, (event, filename) => {
            if (filename && (filename.endsWith('.yaml') || filename.endsWith('.yml'))) {
                const filePath = path.join(routesDir, filename);
                if (fs.existsSync(filePath)) {
                    try {
                        const config = (0, loader_1.loadRouteConfig)(filePath);
                        const routeName = path.basename(filename, path.extname(filename));
                        this.routes.set(routeName, config);
                        onChange();
                    }
                    catch (err) {
                        console.error(`Failed to reload route ${filename}:`, err);
                    }
                }
            }
        });
    }
}
exports.PluginLoader = PluginLoader;
//# sourceMappingURL=loader.js.map