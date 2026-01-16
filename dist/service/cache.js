import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getConfig } from '../config.js';
export class CacheService {
    memoryCache;
    diskCachePath;
    stats;
    config;
    shardCount;
    maxSizeBytes;
    constructor() {
        this.config = getConfig();
        this.memoryCache = new Map();
        this.diskCachePath = this.config.cachePath;
        this.shardCount = 8;
        this.maxSizeBytes = this.config.cacheMaxSizeMB * 1024 * 1024;
        this.stats = {
            hits: 0,
            misses: 0,
            size: 0,
            maxSize: this.maxSizeBytes
        };
        this.ensureCacheDir();
    }
    ensureCacheDir() {
        try {
            if (!fs.existsSync(this.diskCachePath)) {
                fs.mkdirSync(this.diskCachePath, { recursive: true });
            }
            for (let i = 0; i < this.shardCount; i++) {
                const shardDir = path.join(this.diskCachePath, `shard_${i}`);
                if (!fs.existsSync(shardDir)) {
                    fs.mkdirSync(shardDir, { recursive: true });
                }
            }
        }
        catch (error) {
            console.error('Failed to create cache directory:', error);
        }
    }
    getShard(key) {
        const hash = crypto.createHash('md5').update(key).digest('hex');
        return parseInt(hash.substring(0, 2), 16) % this.shardCount;
    }
    getCacheKey(key) {
        return crypto.createHash('md5').update(key).digest('hex');
    }
    getDiskPath(key) {
        const shard = this.getShard(key);
        const cacheKey = this.getCacheKey(key);
        return path.join(this.diskCachePath, `shard_${shard}`, `${cacheKey}.cache`);
    }
    get(key) {
        const now = Date.now();
        const entry = this.memoryCache.get(key);
        if (entry) {
            if (now - entry.timestamp < entry.ttl) {
                this.stats.hits++;
                return entry.data;
            }
            else {
                this.memoryCache.delete(key);
            }
        }
        const diskPath = this.getDiskPath(key);
        if (fs.existsSync(diskPath)) {
            try {
                const content = fs.readFileSync(diskPath, 'utf-8');
                const entry = JSON.parse(content);
                if (now - entry.timestamp < entry.ttl) {
                    this.stats.hits++;
                    this.memoryCache.set(key, entry);
                    return entry.data;
                }
                else {
                    fs.unlinkSync(diskPath);
                }
            }
            catch (error) {
                console.error('Failed to read cache from disk:', error);
            }
        }
        this.stats.misses++;
        return null;
    }
    set(key, data, ttl) {
        const ttlMs = (ttl || this.config.cacheTTLMinutes) * 60 * 1000;
        const entry = {
            key,
            data,
            timestamp: Date.now(),
            ttl: ttlMs
        };
        this.memoryCache.set(key, entry);
        try {
            const diskPath = this.getDiskPath(key);
            fs.writeFileSync(diskPath, JSON.stringify(entry));
        }
        catch (error) {
            console.error('Failed to write cache to disk:', error);
        }
    }
    delete(key) {
        this.memoryCache.delete(key);
        try {
            const diskPath = this.getDiskPath(key);
            if (fs.existsSync(diskPath)) {
                fs.unlinkSync(diskPath);
            }
        }
        catch (error) {
            console.error('Failed to delete cache from disk:', error);
        }
    }
    clear() {
        this.memoryCache.clear();
        try {
            for (let i = 0; i < this.shardCount; i++) {
                const shardDir = path.join(this.diskCachePath, `shard_${i}`);
                if (fs.existsSync(shardDir)) {
                    const files = fs.readdirSync(shardDir);
                    for (const file of files) {
                        fs.unlinkSync(path.join(shardDir, file));
                    }
                }
            }
        }
        catch (error) {
            console.error('Failed to clear disk cache:', error);
        }
    }
    getStats() {
        return { ...this.stats };
    }
    flushMemoryToDisk() {
        for (const [key, entry] of this.memoryCache) {
            try {
                const diskPath = this.getDiskPath(key);
                fs.writeFileSync(diskPath, JSON.stringify(entry));
            }
            catch (error) {
                console.error('Failed to flush cache to disk:', error);
            }
        }
    }
}
let globalCache = null;
export function getCache() {
    if (!globalCache) {
        globalCache = new CacheService();
    }
    return globalCache;
}
//# sourceMappingURL=cache.js.map