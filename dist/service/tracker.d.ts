export interface DownloadTask {
    id: string;
    url: string;
    filename: string;
    status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
    progress: number;
    speed: number;
    size: number;
    downloaded: number;
    createdAt: Date;
    updatedAt: Date;
    error?: string;
    type: string;
    password?: string;
    path?: string;
}
export interface DownloadStats {
    total: number;
    completed: number;
    failed: number;
    downloading: number;
    totalSize: number;
    totalDownloaded: number;
    averageSpeed: number;
}
export interface Aria2Status {
    gid: string;
    status: 'active' | 'waiting' | 'paused' | 'error' | 'complete' | 'removed';
    totalLength: string;
    completedLength: string;
    downloadSpeed: string;
    files: Array<{
        index: number;
        path: string;
        length: string;
        completedLength: string;
        selected: boolean;
        uris: Array<{
            uri: string;
            status: string;
        }>;
    }>;
}
export declare class DownloadTracker {
    private tasks;
    private httpClient;
    private aria2RpcUrl;
    private aria2Secret;
    private statsInterval;
    constructor(aria2RpcUrl?: string, aria2Secret?: string);
    addTask(url: string, filename: string, type: string, password?: string): string;
    updateTask(id: string, updates: Partial<DownloadTask>): boolean;
    getTask(id: string): DownloadTask | undefined;
    getAllTasks(): DownloadTask[];
    getStats(): DownloadStats;
    removeTask(id: string): boolean;
    cleanupOldTasks(olderThanDays?: number): number;
    syncAria2Status(): Promise<void>;
    private getAria2Tasks;
    private findTaskByUrl;
    private generateTaskId;
    private startStatsMonitoring;
    stopMonitoring(): void;
    exportTasks(): string;
    importTasks(data: string): number;
}
export declare function getDownloadTracker(aria2RpcUrl?: string, aria2Secret?: string): DownloadTracker;
export declare function cleanupDownloadTracker(): void;
//# sourceMappingURL=tracker.d.ts.map