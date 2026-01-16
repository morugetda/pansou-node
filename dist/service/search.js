import { getConfig } from '../config.js';
import { getCache } from './cache.js';
import { getTelegramSearch } from './telegram.js';
import { getPluginManager } from './plugin.js';
import { mergeLinksByType } from '../utils/cloud-type.js';
export class SearchService {
    config;
    cache;
    telegramSearch;
    pluginManager;
    constructor() {
        this.config = getConfig();
        this.cache = getCache();
        this.telegramSearch = getTelegramSearch();
        this.pluginManager = getPluginManager();
    }
    async search(options) {
        console.log(`[Search] 开始搜索关键词: "${options.kw}"`);
        const cacheKey = this.generateCacheKey(options);
        if (!options.refresh) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                console.log(`[Search] 使用缓存结果，数量: ${cached.total}`);
                return cached;
            }
        }
        const allResults = [];
        const tgResults = [];
        const searches = [];
        const shouldSearchTG = !options.src || options.src === 'all' || options.src === 'tg';
        const shouldSearchPlugin = !options.src || options.src === 'all' || options.src === 'plugin';
        console.log(`[Search] 搜索配置 - TG: ${shouldSearchTG}, Plugin: ${shouldSearchPlugin}`);
        if (shouldSearchTG) {
            searches.push(this.telegramSearch.search(options.kw, {
                channels: options.channels,
                conc: options.conc,
                refresh: options.refresh
            }).then(results => {
                console.log(`[Search] TG搜索完成，结果数量: ${results.length}`);
                tgResults.push(...results);
                allResults.push(...results.map(r => ({
                    ...r,
                    links: r.links.map((l) => ({
                        ...l,
                        datetime: r.datetime
                    }))
                })));
            }).catch(error => {
                console.error(`[Search] TG搜索失败:`, error instanceof Error ? error.message : String(error));
            }));
        }
        if (shouldSearchPlugin && this.config.asyncPluginEnabled) {
            searches.push(this.pluginManager.search(options.kw, options.plugins).then(results => {
                console.log(`[Search] 插件搜索完成，插件数量: ${results.length}`);
                for (const pluginResult of results) {
                    console.log(`[Search] 插件 ${pluginResult.name} 结果数量: ${pluginResult.results.length}`);
                    allResults.push(...pluginResult.results.map(r => ({
                        ...r,
                        links: r.links.map((l) => ({
                            ...l,
                            datetime: r.datetime
                        }))
                    })));
                }
            }).catch(error => {
                console.error(`[Search] 插件搜索失败:`, error instanceof Error ? error.message : String(error));
            }));
        }
        await Promise.allSettled(searches);
        console.log(`[Search] 关键词 "${options.kw}" 搜索完成，allResults数量: ${allResults.length}, tgResults数量: ${tgResults.length}`);
        let filteredResults = allResults;
        if (options.filter) {
            filteredResults = this.applyFilter(allResults, options.filter);
        }
        const merged = mergeLinksByType(filteredResults);
        console.log(`[Search] 合并后的网盘类型:`, Object.keys(merged).filter(key => merged[key].length > 0));
        let filteredByCloudType = merged;
        if (options.cloud_types && options.cloud_types.length > 0) {
            filteredByCloudType = {};
            for (const type of options.cloud_types) {
                if (merged[type]) {
                    filteredByCloudType[type] = merged[type];
                }
            }
        }
        const response = {
            total: filteredResults.length,
            results: filteredResults,
            merged_by_type: filteredByCloudType
        };
        console.log(`[Search] 最终响应 - 总数: ${response.total}`);
        if (!options.refresh) {
            this.cache.set(cacheKey, response);
        }
        return response;
    }
    generateCacheKey(options) {
        const parts = [
            options.kw,
            options.channels?.join(',') || '',
            options.plugins?.join(',') || '',
            options.cloud_types?.join(',') || '',
            JSON.stringify(options.filter || {})
        ];
        return `search:${Buffer.from(parts.join('|')).toString('base64')}`;
    }
    applyFilter(results, filter) {
        return results.filter(result => {
            const text = `${result.title} ${result.content}`.toLowerCase();
            if (filter.exclude && filter.exclude.length > 0) {
                for (const excludeWord of filter.exclude) {
                    if (text.includes(excludeWord.toLowerCase())) {
                        return false;
                    }
                }
            }
            if (filter.include && filter.include.length > 0) {
                let hasInclude = false;
                for (const includeWord of filter.include) {
                    if (text.includes(includeWord.toLowerCase())) {
                        hasInclude = true;
                        break;
                    }
                }
                if (!hasInclude) {
                    return false;
                }
            }
            return true;
        });
    }
}
let globalSearchService = null;
export function getSearchService() {
    if (!globalSearchService) {
        globalSearchService = new SearchService();
    }
    return globalSearchService;
}
//# sourceMappingURL=search.js.map