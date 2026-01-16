import { TelegramSearchResult } from './telegram.js';
import { CloudType, ParsedResult } from '../utils/cloud-type.js';
export interface SearchOptions {
    kw: string;
    channels?: string[];
    conc?: number;
    refresh?: boolean;
    res?: 'all' | 'results' | 'merge';
    src?: 'all' | 'tg' | 'plugin';
    plugins?: string[];
    cloud_types?: CloudType[];
    ext?: Record<string, any>;
    filter?: {
        include?: string[];
        exclude?: string[];
    };
}
export interface SearchResponse {
    total: number;
    results: TelegramSearchResult[];
    merged_by_type: Record<CloudType, ParsedResult[]>;
}
export declare class SearchService {
    private config;
    private cache;
    private telegramSearch;
    private pluginManager;
    constructor();
    search(options: SearchOptions): Promise<SearchResponse>;
    private generateCacheKey;
    private applyFilter;
}
export declare function getSearchService(): SearchService;
//# sourceMappingURL=search.d.ts.map