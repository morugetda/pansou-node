import { CloudType } from '../utils/cloud-type.js';
export interface TelegramSearchResult {
    message_id: string;
    unique_id: string;
    channel: string;
    datetime: string;
    title: string;
    content: string;
    links: Array<{
        type: CloudType;
        url: string;
        password?: string;
        datetime?: string;
        work_title?: string;
    }>;
    tags?: string[];
    images?: string[];
}
export interface TelegramSearchOptions {
    channels?: string[];
    conc?: number;
    refresh?: boolean;
}
export declare class TelegramSearchService {
    private config;
    private httpClient;
    constructor();
    search(keyword: string, options?: TelegramSearchOptions): Promise<TelegramSearchResult[]>;
    private searchChannel;
    private extractTitle;
    private extractContent;
    private chunkArray;
}
export declare function getTelegramSearch(): TelegramSearchService;
//# sourceMappingURL=telegram.d.ts.map