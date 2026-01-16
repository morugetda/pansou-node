export type CloudType = 'baidu' | 'aliyun' | 'quark' | 'tianyi' | 'uc' | 'mobile' | '115' | 'pikpak' | 'xunlei' | '123' | 'magnet' | 'ed2k' | 'others';
export interface LinkInfo {
    type: CloudType;
    url: string;
    password?: string;
    datetime?: string;
    work_title?: string;
}
export interface ParsedResult {
    type: CloudType;
    url: string;
    password: string;
    note: string;
    datetime?: string;
    source?: string;
    images?: string[];
}
export declare function detectCloudType(url: string): CloudType;
export declare function extractPassword(text: string): string | undefined;
export declare function parseLinks(text: string): LinkInfo[];
export declare function mergeLinksByType(results: any[]): Record<CloudType, ParsedResult[]>;
export declare const cloudTypeNames: Record<CloudType, string>;
//# sourceMappingURL=cloud-type.d.ts.map