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
exports.loadAppConfig = loadAppConfig;
exports.loadRouteConfig = loadRouteConfig;
exports.loadAllRoutes = loadAllRoutes;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
const DEFAULT_APP_CONFIG = {
    server: { port: 3000, host: '0.0.0.0' },
    cache: { enabled: true, defaultTtl: 300 },
    antiScrape: { rotateUserAgent: true, defaultDelay: 1000 },
    routesDir: path.resolve(process.cwd(), 'routes'),
    pluginsDir: path.resolve(process.cwd(), 'plugins'),
};
function loadAppConfig(configPath) {
    if (configPath && fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf-8');
        const parsed = yaml.load(raw);
        return { ...DEFAULT_APP_CONFIG, ...parsed };
    }
    const defaultPath = path.resolve(process.cwd(), 'config.yaml');
    if (fs.existsSync(defaultPath)) {
        const raw = fs.readFileSync(defaultPath, 'utf-8');
        const parsed = yaml.load(raw);
        return { ...DEFAULT_APP_CONFIG, ...parsed };
    }
    return DEFAULT_APP_CONFIG;
}
function loadRouteConfig(filePath) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const config = yaml.load(raw);
    validateRouteConfig(config, filePath);
    return config;
}
function loadAllRoutes(routesDir) {
    const routes = new Map();
    if (!fs.existsSync(routesDir))
        return routes;
    const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
    for (const file of files) {
        const filePath = path.join(routesDir, file);
        const config = loadRouteConfig(filePath);
        const routeName = path.basename(file, path.extname(file));
        routes.set(routeName, config);
    }
    return routes;
}
function validateRouteConfig(config, filePath) {
    const required = ['name', 'url', 'itemSelector', 'fields', 'feed'];
    for (const key of required) {
        if (!config[key]) {
            throw new Error(`Route config ${filePath} missing required field: ${key}`);
        }
    }
    if (!config.fields.title || !config.fields.link) {
        throw new Error(`Route config ${filePath} must define fields.title and fields.link`);
    }
}
//# sourceMappingURL=loader.js.map