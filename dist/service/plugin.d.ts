import { CloudType } from '../utils/cloud-type.js';
export interface PluginResult {
    name: string;
    results: SearchResult[];
    error?: string;
}
export interface Plugin {
    name: string;
    priority: number;
    search(keyword: string): Promise<PluginResult>;
    getName(): string;
    getPriority(): number;
}
interface BaseSearchResult {
    title: string;
    content: string;
    url: string;
    datetime?: string;
    links: Array<{
        type: CloudType;
        url: string;
        password?: string;
    }>;
    images?: string[];
}
export interface SearchResult extends BaseSearchResult {
    source: string;
}
declare class PluginManagerClass {
    private plugins;
    private config;
    constructor();
    private registerDefaultPlugins;
    registerPlugin(plugin: Plugin): void;
    unregisterPlugin(name: string): void;
    getPlugin(name: string): Plugin | undefined;
    getPlugins(): Plugin[];
    search(keyword: string, pluginNames?: string[]): Promise<PluginResult[]>;
}
export declare function getPluginManager(): PluginManagerClass;
export {};
//# sourceMappingURL=plugin.d.ts.map