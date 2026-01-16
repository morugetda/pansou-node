import { Request, Response } from 'express';
export declare function handleCORSProxy(req: Request, res: Response): Promise<void>;
export declare function handleSearch(req: Request, res: Response): Promise<void>;
export declare function handleAuthLogin(req: Request, res: Response): Promise<void>;
export declare function handleAuthVerify(req: Request, res: Response): Promise<void>;
export declare function handleAuthLogout(req: Request, res: Response): Promise<void>;
export declare function handleDownload(req: Request, res: Response): Promise<void>;
export declare function handleBatchDownload(req: Request, res: Response): Promise<void>;
export declare function handleDownloadStatus(req: Request, res: Response): Promise<void>;
export declare function handleSyncDownloads(req: Request, res: Response): Promise<void>;
export declare function handleExportTasks(req: Request, res: Response): Promise<void>;
export declare function handleImportTasks(req: Request, res: Response): Promise<void>;
export declare function handleHealth(req: Request, res: Response): void;
//# sourceMappingURL=handlers.d.ts.map