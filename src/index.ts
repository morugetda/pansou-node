import { loadConfig, getConfig } from './config.js';
import { setupRouter } from './api/router.js';
import { getCache } from './service/cache.js';
import { getAuthService } from './service/auth.js';

async function main(): Promise<void> {
  loadConfig();
  const config = getConfig();

  const app = setupRouter();

  const server = app.listen(8080, () => {
    printServiceInfo(config);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n收到 ${signal} 信号，正在关闭服务器...`);

    const cache = getCache();
    cache.flushMemoryToDisk();

    server.close(() => {
      console.log('服务器已关闭');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('强制关闭');
      process.exit(1);
    }, 5000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  if (process.platform === 'win32') {
    process.on('SIGBREAK', () => shutdown('SIGBREAK'));
  }
}

function printServiceInfo(config: ReturnType<typeof getConfig>): void {
  console.log(`服务器启动在 http://localhost:8080`);

  if (config.proxyURL) {
    console.log(`使用代理: ${config.proxyURL}`);
  } else {
    console.log('未使用代理');
  }

  console.log(`默认并发数: ${config.defaultConcurrency}`);
  console.log(`缓存: ${config.cachePath}, 最大${config.cacheMaxSizeMB}MB, TTL${config.cacheTTLMinutes}分钟`);
  console.log(`认证: ${config.authEnabled ? '启用' : '禁用'}`);
  console.log(`插件: ${config.asyncPluginEnabled ? '启用' : '禁用'}`);
}

main().catch(error => {
  console.error('启动失败:', error);
  process.exit(1);
});
