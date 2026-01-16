export interface AppConfig {
    port: number;
    proxyURL: string;
    httpProxyURL: string;
    httpsProxyURL: string;
    defaultChannels: string[];
    enabledPlugins: string[];
    authEnabled: boolean;
    authUsers: Record<string, string>;
    authTokenExpiry: number;
    jwtSecret: string;
    defaultConcurrency: number;
    cacheTTLMinutes: number;
    cacheMaxSizeMB: number;
    cachePath: string;
    pluginTimeout: number;
    asyncResponseTimeout: number;
    asyncPluginEnabled: boolean;
    asyncMaxBackgroundWorkers: number;
    asyncMaxBackgroundTasks: number;
    asyncCacheTTLHours: number;
    enableCompression: boolean;
    minSizeToCompress: number;
    httpReadTimeout: number;
    httpWriteTimeout: number;
    httpIdleTimeout: number;
    httpMaxConns: number;
    gcPercent: number;
    optimizeMemory: boolean;
}
export declare function loadConfig(): AppConfig;
export declare function getConfig(): AppConfig;
//# sourceMappingURL=config.d.ts.map