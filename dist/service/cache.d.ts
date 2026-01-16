interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    maxSize: number;
}
export declare class CacheService {
    private memoryCache;
    private diskCachePath;
    private stats;
    private config;
    private shardCount;
    private maxSizeBytes;
    constructor();
    private ensureCacheDir;
    private getShard;
    private getCacheKey;
    private getDiskPath;
    get(key: string): any | null;
    set(key: string, data: any, ttl?: number): void;
    delete(key: string): void;
    clear(): void;
    getStats(): CacheStats;
    flushMemoryToDisk(): void;
}
export declare function getCache(): CacheService;
export {};
//# sourceMappingURL=cache.d.ts.map