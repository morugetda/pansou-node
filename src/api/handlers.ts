import { Request, Response } from 'express';
import { z } from 'zod';
import { getSearchService } from '../service/search.js';
import { getAuthService } from '../service/auth.js';
import { getConfig } from '../config.js';
import { getPluginManager } from '../service/plugin.js';
import { getDownloadTracker } from '../service/tracker.js';
import { cloudTypeNames, CloudType } from '../utils/cloud-type.js';

// CORS代理处理器
export async function handleCORSProxy(req: Request, res: Response): Promise<void> {
  const targetUrl = req.query.url as string;
  
  if (!targetUrl) {
    res.status(400).json({ error: 'Missing url parameter' });
    return;
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': req.headers['accept'] || 'application/json, text/plain, */*',
        'Referer': req.headers['referer'] || 'https://pan.quark.cn/',
        'Origin': req.headers['origin'] || 'https://pan.quark.cn',
        'Content-Type': req.headers['content-type'] || 'application/json',
        'Accept-Language': req.headers['accept-language'] || 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': req.headers['accept-encoding'] || 'gzip, deflate, br',
        'Cache-Control': req.headers['cache-control'] || 'no-cache',
        'Pragma': req.headers['pragma'] || 'no-cache'
      },
      body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined
    });

    // 设置CORS头
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Content-Type': response.headers.get('content-type') || 'application/json'
    });

    // 转发响应
    const data = await response.arrayBuffer();
    res.status(response.status);
    res.send(Buffer.from(data));

  } catch (error) {
    console.error('CORS Proxy Error:', error);
    res.status(500).json({ error: 'Proxy request failed' });
  }
}

const SearchSchema = z.object({
  kw: z.string().min(1, '关键词不能为空'),
  channels: z.array(z.string()).optional(),
  conc: z.number().optional(),
  refresh: z.boolean().optional(),
  res: z.enum(['all', 'results', 'merge']).optional(),
  src: z.enum(['all', 'tg', 'plugin']).optional(),
  plugins: z.array(z.string()).optional(),
  cloud_types: z.array(z.string()).optional(),
  ext: z.record(z.any()).optional(),
  filter: z.object({
    include: z.array(z.string()).optional(),
    exclude: z.array(z.string()).optional()
  }).optional()
});

export async function handleSearch(req: Request, res: Response): Promise<void> {
  try {
    let searchParams;
    
    if (req.method === 'GET') {
      searchParams = {
        kw: req.query.kw as string,
        channels: req.query.channels ? (req.query.channels as string).split(',') : undefined,
        conc: req.query.conc ? parseInt(req.query.conc as string) : undefined,
        refresh: req.query.refresh === 'true',
        res: req.query.res as 'all' | 'results' | 'merge' | undefined,
        src: req.query.src as 'all' | 'tg' | 'plugin' | undefined,
        plugins: req.query.plugins ? (req.query.plugins as string).split(',') : undefined,
        cloud_types: req.query.cloud_types ? (req.query.cloud_types as string).split(',') as CloudType[] : undefined,
        ext: req.query.ext ? JSON.parse(req.query.ext as string) : undefined,
        filter: req.query.filter ? JSON.parse(req.query.filter as string) : undefined
      };
    } else {
      searchParams = req.body || {};
    }

    const parsed = SearchSchema.parse(searchParams);

    const searchService = getSearchService();
    const result = await searchService.search({
      ...parsed,
      cloud_types: parsed.cloud_types as CloudType[] | undefined
    });

    let response = result;
    if (parsed.res === 'results') {
      response = {
        total: result.total,
        results: result.results,
        merged_by_type: {} as Record<CloudType, any[]>
      };
    } else if (parsed.res === 'merge') {
      response = {
        total: Object.values(result.merged_by_type).reduce((sum, arr) => sum + arr.length, 0),
        results: [],
        merged_by_type: result.merged_by_type
      };
    }

    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        code: 400,
        message: error.errors[0].message
      });
      return;
    }

    console.error('Search error:', error);
    res.status(500).json({
      code: 500,
      message: '搜索失败'
    });
  }
}

export async function handleAuthLogin(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      res.status(400).json({
        error: '用户名和密码不能为空'
      });
      return;
    }

    const authService = getAuthService();
    const result = await authService.login(username, password);

    if (!result) {
      res.status(401).json({
        error: '用户名或密码错误'
      });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: '登录失败'
    });
  }
}

export async function handleAuthVerify(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: '未授权：缺少认证令牌'
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const authService = getAuthService();
    const result = authService.verifyToken(token);

    res.json(result);
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({
      valid: false
    });
  }
}

export async function handleAuthLogout(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const authService = getAuthService();
      authService.logout(token);
    }

    res.json({
      message: '退出成功'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: '退出失败'
    });
  }
}

export async function handleDownload(req: Request, res: Response): Promise<void> {
  try {
    const { url, type, password, options } = req.body;
    
    if (!url || !type) {
      res.status(400).json({
        error: '缺少必要参数: url, type'
      });
      return;
    }

    const { getDownloadHelper } = await import('../service/download.js');
    const downloadHelper = getDownloadHelper();
    
    const directLink = await downloadHelper.getDirectLink(url, type);
    
    if (!directLink) {
      res.status(404).json({
        error: '无法解析下载链接'
      });
      return;
    }

    // 添加密码到链接
    if (password) {
      directLink.password = password;
    }

    // 生成多种下载方式
    const aria2Commands = downloadHelper.generateAria2Commands([directLink], password, options);
    const aria2RPC = downloadHelper.generateAria2RPCConfig([directLink]);
    const qbtCommands = downloadHelper.generateQBTCommands([directLink]);
    const transmissionCommands = downloadHelper.generateTransmissionCommands([directLink]);
    const jdCommands = downloadHelper.generateJDCommands([directLink]);
    const xunleiCommands = downloadHelper.generateXunleiCommands([directLink]);
    const pythonScript = downloadHelper.generatePythonDownloadScript([directLink], options);
    const idmList = downloadHelper.generateIDMList([directLink], password);
    const downloadScript = downloadHelper.generateDownloadScript([directLink]);

    res.json({
      success: true,
      directLink,
      downloadMethods: {
        direct: directLink.url,
        aria2c: aria2Commands,
        aria2rpc: aria2RPC,
        qbt: qbtCommands,
        transmission: transmissionCommands,
        jdownloader: jdCommands,
        xunlei: xunleiCommands,
        python: pythonScript,
        idm: idmList,
        script: downloadScript
      },
      tips: [
        '方法1: 直接点击链接在新标签页打开',
        '方法2: 使用 aria2c 命令行工具',
        '方法3: 使用 Aria2 RPC 接口',
        '方法4: 使用 qBittorrent Web API',
        '方法5: 使用 Transmission RPC',
        '方法6: 使用 JDownloader 2',
        '方法7: 使用迅雷命令行',
        '方法8: 使用 Python 脚本下载',
        '方法9: 导入 IDM 下载管理器',
        '方法10: 浏览器控制台运行脚本批量下载'
      ]
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      error: '处理下载请求失败'
    });
  }
}

export async function handleBatchDownload(req: Request, res: Response): Promise<void> {
  try {
    const { links, options } = req.body;
    
    if (!links || !Array.isArray(links) || links.length === 0) {
      res.status(400).json({
        error: '缺少必要参数: links (数组格式)'
      });
      return;
    }

    // 验证链接格式
    for (const link of links) {
      if (!link.url || !link.type) {
        res.status(400).json({
          error: '每个链接必须包含 url 和 type 字段'
        });
        return;
      }
    }

    const { getDownloadHelper } = await import('../service/download.js');
    const downloadHelper = getDownloadHelper();
    
    const processedLinks: any[] = [];
    const failedLinks: any[] = [];

    // 并行处理所有链接
    for (const linkData of links) {
      try {
        const directLink = await downloadHelper.getDirectLink(linkData.url, linkData.type);
        
        if (directLink) {
          // 添加额外信息
          if (linkData.password) {
            directLink.password = linkData.password;
          }
          if (linkData.filename) {
            directLink.filename = linkData.filename;
          }
          processedLinks.push(directLink);
        } else {
          failedLinks.push({
            url: linkData.url,
            error: '无法解析下载链接'
          });
        }
      } catch (error) {
        failedLinks.push({
          url: linkData.url,
          error: error instanceof Error ? error.message : '解析失败'
        });
      }
    }

    if (processedLinks.length === 0) {
      res.status(400).json({
        error: '所有链接都无法解析',
        failed: failedLinks
      });
      return;
    }

    // 生成批量下载脚本
    const aria2Commands = downloadHelper.generateAria2Commands(processedLinks, undefined, options);
    const aria2RPC = downloadHelper.generateAria2RPCConfig(processedLinks);
    const qbtCommands = downloadHelper.generateQBTCommands(processedLinks);
    const transmissionCommands = downloadHelper.generateTransmissionCommands(processedLinks);
    const jdCommands = downloadHelper.generateJDCommands(processedLinks);
    const xunleiCommands = downloadHelper.generateXunleiCommands(processedLinks);
    const pythonScript = downloadHelper.generatePythonDownloadScript(processedLinks, options);
    const idmList = downloadHelper.generateIDMList(processedLinks);
    const downloadScript = downloadHelper.generateDownloadScript(processedLinks);

    res.json({
      success: true,
      total: links.length,
      processed: processedLinks.length,
      failed: failedLinks.length,
      directLinks: processedLinks,
      failedLinks,
      downloadMethods: {
        aria2c: aria2Commands,
        aria2rpc: aria2RPC,
        qbt: qbtCommands,
        transmission: transmissionCommands,
        jdownloader: jdCommands,
        xunlei: xunleiCommands,
        python: pythonScript,
        idm: idmList,
        script: downloadScript
      },
      tips: [
        `批量处理完成: 成功 ${processedLinks.length} 个, 失败 ${failedLinks.length} 个`,
        '方法1: 使用 aria2c 批量命令 (推荐)',
        '方法2: 使用 Aria2 RPC 接口 (需运行 aria2 服务)',
        '方法3: 使用 qBittorrent Web API',
        '方法4: 使用 Transmission RPC',
        '方法5: 使用 JDownloader 2',
        '方法6: 使用迅雷命令行',
        '方法7: 使用 Python 脚本下载',
        '方法8: 导入 IDM 下载管理器',
        '方法9: 浏览器控制台运行脚本批量下载'
      ]
    });
  } catch (error) {
    console.error('Batch download error:', error);
    res.status(500).json({
      error: '处理批量下载请求失败'
    });
  }
}

export async function handleDownloadStatus(req: Request, res: Response): Promise<void> {
  try {
    const tracker = getDownloadTracker();
    
    const taskId = req.query.taskId as string;
    if (taskId) {
      const task = tracker.getTask(taskId);
      if (!task) {
        res.status(404).json({
          error: '任务不存在'
        });
        return;
      }
      res.json({ task });
    } else {
      const tasks = tracker.getAllTasks();
      const stats = tracker.getStats();
      
      res.json({
        tasks,
        stats,
        summary: {
          total: stats.total,
          active: stats.downloading,
          completed: stats.completed,
          failed: stats.failed
        }
      });
    }
  } catch (error) {
    console.error('Download status error:', error);
    res.status(500).json({
      error: '获取下载状态失败'
    });
  }
}

export async function handleSyncDownloads(req: Request, res: Response): Promise<void> {
  try {
    const tracker = getDownloadTracker();
    await tracker.syncAria2Status();
    
    res.json({
      success: true,
      message: '同步完成',
      stats: tracker.getStats()
    });
  } catch (error) {
    console.error('Sync downloads error:', error);
    res.status(500).json({
      error: '同步下载状态失败'
    });
  }
}

export async function handleExportTasks(req: Request, res: Response): Promise<void> {
  try {
    const tracker = getDownloadTracker();
    const exportData = tracker.exportTasks();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="pansou-tasks-${new Date().toISOString().split('T')[0]}.json"`);
    res.send(exportData);
  } catch (error) {
    console.error('Export tasks error:', error);
    res.status(500).json({
      error: '导出任务失败'
    });
  }
}

export async function handleImportTasks(req: Request, res: Response): Promise<void> {
  try {
    const { data } = req.body;
    
    if (!data) {
      res.status(400).json({
        error: '缺少导入数据'
      });
      return;
    }

    const tracker = getDownloadTracker();
    const imported = tracker.importTasks(data);
    
    res.json({
      success: true,
      imported,
      message: `成功导入 ${imported} 个任务`
    });
  } catch (error) {
    console.error('Import tasks error:', error);
    res.status(500).json({
      error: '导入任务失败'
    });
  }
}

export function handleHealth(req: Request, res: Response): void {
  const config = getConfig();
  const pluginManager = getPluginManager();

  res.json({
    status: 'ok',
    auth_enabled: config.authEnabled,
    plugins_enabled: config.asyncPluginEnabled,
    plugin_count: pluginManager.getPlugins().length,
    plugins: pluginManager.getPlugins().map(p => p.getName()),
    channels_count: config.defaultChannels.length,
    channels: config.defaultChannels
  });
}
