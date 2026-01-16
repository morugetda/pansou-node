export interface DirectLink {
    url: string;
    filename?: string;
    size?: string;
    type: 'direct' | 'redirect' | 'script';
    password?: string;
    headers?: Record<string, string>;
}
export interface DownloadOptions {
    concurrent?: number;
    maxRetries?: number;
    timeout?: number;
    userAgent?: string;
    referer?: string;
}
export interface Aria2Config {
    rpcUrl?: string;
    rpcSecret?: string;
    options?: {
        'max-connection-per-server'?: number;
        'split'?: number;
        'min-split-size'?: string;
        'user-agent'?: string;
        'referer'?: string;
        'header'?: string[];
        'out'?: string;
        'dir'?: string;
    };
}
export declare class DownloadHelper {
    private httpClient;
    getDirectLink(originalUrl: string, type: string): Promise<DirectLink | null>;
    private parseBaiduLink;
    private parseAliyunLink;
    private parseQuarkLink;
    private parseTianyiLink;
    private parse115Link;
    private parseUCLink;
    private parseXunleiLink;
    private extractBaiduShareId;
    private extractAliyunShareId;
    private extractQuarkShareId;
    private extractFilename;
    generateDownloadScript(links: DirectLink[]): string;
    generateAria2Commands(links: DirectLink[], password?: string, options?: DownloadOptions): string[];
    generateAria2RPCConfig(links: DirectLink[], config?: Aria2Config): string;
    generateQBTCommands(links: DirectLink[], qbUrl?: string, username?: string, password?: string): string;
    generateTransmissionCommands(links: DirectLink[], trUrl?: string, username?: string, password?: string): string;
    generateJDCommands(links: DirectLink[]): string;
    generateXunleiCommands(links: DirectLink[]): string;
    generatePythonDownloadScript(links: DirectLink[], options?: DownloadOptions): string;
    generateIDMList(links: DirectLink[], password?: string): string;
}
export declare function getDownloadHelper(): DownloadHelper;
//# sourceMappingURL=download.d.ts.map