import express, { Router, Express, Request, Response } from 'express';
import { handleSearch, handleAuthLogin, handleAuthVerify, handleAuthLogout, handleDownload, handleBatchDownload, handleDownloadStatus, handleSyncDownloads, handleExportTasks, handleImportTasks, handleHealth, handleCORSProxy } from './handlers.js';
import { authMiddleware, optionalAuthMiddleware, optionalAuthLogout } from './middleware.js';
import path from 'path';
import fs from 'fs';

function handleNotFound(req: Request, res: Response): void {
  res.status(404).json({
    code: 404,
    message: '接口不存在'
  });
}

function handleError(err: Error, req: Request, res: Response, next: Function): void {
  console.error('Error:', err);
  res.status(500).json({
    code: 500,
    message: '内部服务器错误'
  });
}

export function setupRouter(): Express {
  const app = express();
  
  // CORS中间件
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    
    next();
  });
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const webPath = path.resolve('./examples/web');
  if (fs.existsSync(webPath)) {
    // 静态文件服务
    app.use(express.static(webPath));
    app.use('/examples/web', express.static(webPath));
    app.get('/', (req: Request, res: Response) => {
      res.sendFile(path.join(webPath, 'index.html'));
    });
  }

  app.post('/api/search', authMiddleware, handleSearch);
  app.get('/api/search', optionalAuthMiddleware, handleSearch);

  app.post('/api/auth/login', handleAuthLogin);
  app.post('/api/auth/verify', authMiddleware, handleAuthVerify);
  app.post('/api/auth/logout', optionalAuthLogout, handleAuthLogout);

  app.post('/api/download', handleDownload);
  app.post('/api/batch-download', handleBatchDownload);
  app.get('/api/download/status', optionalAuthMiddleware, handleDownloadStatus);
  app.post('/api/download/sync', handleSyncDownloads);
  app.get('/api/download/export', handleExportTasks);
  app.post('/api/download/import', handleImportTasks);
  app.get('/api/health', handleHealth);

  // CORS代理路由
  app.all('/api/cors-proxy', handleCORSProxy);

  app.use(handleNotFound);
  app.use(handleError);

  return app;
}
