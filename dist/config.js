import { z } from 'zod';
import os from 'os';
const ConfigSchema = z.object({
    PORT: z.string().default('8080'),
    PROXY: z.string().optional(),
    HTTP_PROXY: z.string().optional(),
    HTTPS_PROXY: z.string().optional(),
    CHANNELS: z.string().default('tgsearchers3,Aliyun_4K_Movies,bdbdndn11,yunpanx,bsbdbfjfjff,yp123pan,sbsbsnsqq,yunpanxunlei,tianyifc,BaiduCloudDisk,txtyzy,peccxinpd,gotopan,PanjClub,kkxlzy,baicaoZY,MCPH01,bdwpzhpd,ysxb48,jdjdn1111,yggpan,MCPH086,zaihuayun,Q66Share,ucwpzy,shareAliyun,alyp_1,dianyingshare,Quark_Movies,XiangxiuNBB,ydypzyfx,ucquark,xx123pan,yingshifenxiang123,zyfb123,tyypzhpd,tianyirigeng,cloudtianyi,hdhhd21,Lsp115,oneonefivewpfx,qixingzhenren,taoxgzy,Channel_Shares_115,tyysypzypd,vip115hot,wp123zy,yunpan139,yunpan189,yunpanuc,yydf_hzl,leoziyuan,pikpakpan,Q_dongman,yoyokuakeduanju'),
    ENABLED_PLUGINS: z.string().default('demo,jikepan,pan666,hunhepan,pansearch,panta,qupansou,susu,xuexi,pan789,wanpan,duoji'),
    AUTH_ENABLED: z.string().default('false'),
    AUTH_USERS: z.string().optional(),
    AUTH_TOKEN_EXPIRY: z.string().default('24'),
    AUTH_JWT_SECRET: z.string().optional(),
    CONCURRENCY: z.string().optional(),
    CACHE_TTL: z.string().default('60'),
    CACHE_MAX_SIZE: z.string().default('100'),
    CACHE_PATH: z.string().default('./cache'),
    PLUGIN_TIMEOUT: z.string().default('60'),
    ASYNC_RESPONSE_TIMEOUT: z.string().default('30'),
    ASYNC_PLUGIN_ENABLED: z.string().default('true'),
    ASYNC_MAX_BACKGROUND_WORKERS: z.string().optional(),
    ASYNC_MAX_BACKGROUND_TASKS: z.string().optional(),
    ASYNC_CACHE_TTL_HOURS: z.string().default('1'),
    ENABLE_COMPRESSION: z.string().default('false'),
    MIN_SIZE_TO_COMPRESS: z.string().default('1024'),
    HTTP_READ_TIMEOUT: z.string().default('60'),
    HTTP_WRITE_TIMEOUT: z.string().default('60'),
    HTTP_IDLE_TIMEOUT: z.string().default('120'),
    HTTP_MAX_CONNS: z.string().optional(),
    GC_PERCENT: z.string().default('50'),
    OPTIMIZE_MEMORY: z.string().default('false')
});
let appConfig = null;
export function loadConfig() {
    if (appConfig) {
        return appConfig;
    }
    const env = process.env;
    const rawConfig = {
        PORT: env.PORT,
        PROXY: env.PROXY,
        HTTP_PROXY: env.HTTP_PROXY,
        HTTPS_PROXY: env.HTTPS_PROXY,
        CHANNELS: env.CHANNELS,
        ENABLED_PLUGINS: env.ENABLED_PLUGINS,
        AUTH_ENABLED: env.AUTH_ENABLED,
        AUTH_USERS: env.AUTH_USERS,
        AUTH_TOKEN_EXPIRY: env.AUTH_TOKEN_EXPIRY,
        AUTH_JWT_SECRET: env.AUTH_JWT_SECRET,
        CONCURRENCY: env.CONCURRENCY,
        CACHE_TTL: env.CACHE_TTL,
        CACHE_MAX_SIZE: env.CACHE_MAX_SIZE,
        CACHE_PATH: env.CACHE_PATH,
        PLUGIN_TIMEOUT: env.PLUGIN_TIMEOUT,
        ASYNC_RESPONSE_TIMEOUT: env.ASYNC_RESPONSE_TIMEOUT,
        ASYNC_PLUGIN_ENABLED: env.ASYNC_PLUGIN_ENABLED,
        ASYNC_MAX_BACKGROUND_WORKERS: env.ASYNC_MAX_BACKGROUND_WORKERS,
        ASYNC_MAX_BACKGROUND_TASKS: env.ASYNC_MAX_BACKGROUND_TASKS,
        ASYNC_CACHE_TTL_HOURS: env.ASYNC_CACHE_TTL_HOURS,
        ENABLE_COMPRESSION: env.ENABLE_COMPRESSION,
        MIN_SIZE_TO_COMPRESS: env.MIN_SIZE_TO_COMPRESS,
        HTTP_READ_TIMEOUT: env.HTTP_READ_TIMEOUT,
        HTTP_WRITE_TIMEOUT: env.HTTP_WRITE_TIMEOUT,
        HTTP_IDLE_TIMEOUT: env.HTTP_IDLE_TIMEOUT,
        HTTP_MAX_CONNS: env.HTTP_MAX_CONNS,
        GC_PERCENT: env.GC_PERCENT,
        OPTIMIZE_MEMORY: env.OPTIMIZE_MEMORY
    };
    const parsed = ConfigSchema.parse(rawConfig);
    const channels = parsed.CHANNELS.split(',').filter(c => c.length > 0);
    const enabledPlugins = parsed.ENABLED_PLUGINS?.split(',').filter(p => p.length > 0) || [];
    const authUsers = {};
    if (parsed.AUTH_USERS) {
        for (const user of parsed.AUTH_USERS.split(',')) {
            const [username, password] = user.split(':');
            if (username && password) {
                authUsers[username] = password;
            }
        }
    }
    const cpuCount = os.cpus().length;
    const autoWorkers = parsed.ASYNC_MAX_BACKGROUND_WORKERS || (cpuCount * 5);
    const autoTasks = parsed.ASYNC_MAX_BACKGROUND_TASKS || (parseInt(String(autoWorkers)) * 5);
    const defaultConc = parsed.CONCURRENCY
        ? parseInt(parsed.CONCURRENCY)
        : channels.length + enabledPlugins.length + 10;
    appConfig = {
        port: parseInt(parsed.PORT),
        proxyURL: parsed.PROXY || '',
        httpProxyURL: parsed.HTTP_PROXY || '',
        httpsProxyURL: parsed.HTTPS_PROXY || '',
        defaultChannels: channels,
        enabledPlugins: enabledPlugins,
        authEnabled: parsed.AUTH_ENABLED === 'true',
        authUsers: authUsers,
        authTokenExpiry: parseInt(parsed.AUTH_TOKEN_EXPIRY),
        jwtSecret: parsed.AUTH_JWT_SECRET || generateJwtSecret(),
        defaultConcurrency: defaultConc,
        cacheTTLMinutes: parseInt(parsed.CACHE_TTL),
        cacheMaxSizeMB: parseInt(parsed.CACHE_MAX_SIZE),
        cachePath: parsed.CACHE_PATH,
        pluginTimeout: parseInt(parsed.PLUGIN_TIMEOUT),
        asyncResponseTimeout: parseInt(parsed.ASYNC_RESPONSE_TIMEOUT),
        asyncPluginEnabled: parsed.ASYNC_PLUGIN_ENABLED === 'true',
        asyncMaxBackgroundWorkers: parseInt(String(autoWorkers)),
        asyncMaxBackgroundTasks: parseInt(String(autoTasks)),
        asyncCacheTTLHours: parseInt(parsed.ASYNC_CACHE_TTL_HOURS),
        enableCompression: parsed.ENABLE_COMPRESSION === 'true',
        minSizeToCompress: parseInt(parsed.MIN_SIZE_TO_COMPRESS),
        httpReadTimeout: parsed.HTTP_READ_TIMEOUT ? parseInt(parsed.HTTP_READ_TIMEOUT) : autoTimeout(30),
        httpWriteTimeout: parsed.HTTP_WRITE_TIMEOUT ? parseInt(parsed.HTTP_WRITE_TIMEOUT) : autoTimeout(30),
        httpIdleTimeout: parseInt(parsed.HTTP_IDLE_TIMEOUT),
        httpMaxConns: parsed.HTTP_MAX_CONNS ? parseInt(parsed.HTTP_MAX_CONNS) : cpuCount * 200,
        gcPercent: parseInt(parsed.GC_PERCENT),
        optimizeMemory: parsed.OPTIMIZE_MEMORY === 'true'
    };
    return appConfig;
}
function generateJwtSecret() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secret = '';
    for (let i = 0; i < 32; i++) {
        secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
}
function autoTimeout(seconds) {
    return seconds * 1000;
}
export function getConfig() {
    if (!appConfig) {
        return loadConfig();
    }
    return appConfig;
}
//# sourceMappingURL=config.js.map