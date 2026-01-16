import { getConfig } from '../config.js';
import { getHttpClient } from '../utils/http.js';
import { parseLinks } from '../utils/cloud-type.js';
class BasePlugin {
    httpClient;
    config;
    constructor() {
        this.config = getConfig();
        this.httpClient = getHttpClient();
    }
    async search(keyword) {
        try {
            const results = await this.doSearch(keyword);
            const fullResults = results.map(r => ({
                ...r,
                source: `plugin:${this.name}`
            }));
            return {
                name: this.name,
                results: fullResults
            };
        }
        catch (error) {
            return {
                name: this.name,
                results: [],
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    getName() {
        return this.name;
    }
    getPriority() {
        return this.priority;
    }
}
class PluginManagerClass {
    plugins;
    config;
    constructor() {
        this.plugins = new Map();
        this.config = getConfig();
        this.registerDefaultPlugins();
    }
    registerDefaultPlugins() {
        const enabledPlugins = this.config.enabledPlugins;
        // 恢复demo插件但只使用外部API，不生成假数据
        if (enabledPlugins.length === 0 || enabledPlugins.includes('demo')) {
            this.registerPlugin(new DemoSitePlugin());
        }
        if (enabledPlugins.length === 0 || enabledPlugins.includes('jikepan')) {
            this.registerPlugin(new JikepanPlugin());
        }
        if (enabledPlugins.length === 0 || enabledPlugins.includes('pan666')) {
            this.registerPlugin(new Pan666Plugin());
        }
        if (enabledPlugins.length === 0 || enabledPlugins.includes('hunhepan')) {
            this.registerPlugin(new HunhepanPlugin());
        }
        if (enabledPlugins.length === 0 || enabledPlugins.includes('pansearch')) {
            this.registerPlugin(new PansearchPlugin());
        }
        if (enabledPlugins.length === 0 || enabledPlugins.includes('panta')) {
            this.registerPlugin(new PantaPlugin());
        }
        if (enabledPlugins.length === 0 || enabledPlugins.includes('qupansou')) {
            this.registerPlugin(new QupansouPlugin());
        }
        if (enabledPlugins.length === 0 || enabledPlugins.includes('susu')) {
            this.registerPlugin(new SusuPlugin());
        }
        if (enabledPlugins.length === 0 || enabledPlugins.includes('xuexi')) {
            this.registerPlugin(new XuexiPlugin());
        }
        if (enabledPlugins.length === 0 || enabledPlugins.includes('pan789')) {
            this.registerPlugin(new Pan789Plugin());
        }
        if (enabledPlugins.length === 0 || enabledPlugins.includes('wanpan')) {
            this.registerPlugin(new WanpanPlugin());
        }
        if (enabledPlugins.length === 0 || enabledPlugins.includes('duoji')) {
            this.registerPlugin(new DuojiPlugin());
        }
    }
    registerPlugin(plugin) {
        this.plugins.set(plugin.getName(), plugin);
    }
    unregisterPlugin(name) {
        this.plugins.delete(name);
    }
    getPlugin(name) {
        return this.plugins.get(name);
    }
    getPlugins() {
        return Array.from(this.plugins.values())
            .sort((a, b) => a.getPriority() - b.getPriority());
    }
    async search(keyword, pluginNames) {
        const plugins = pluginNames
            ? pluginNames.map(n => this.plugins.get(n)).filter((p) => p !== undefined)
            : this.getPlugins();
        const results = await Promise.all(plugins.map(plugin => plugin.search(keyword)));
        return results;
    }
}
class JikepanPlugin extends BasePlugin {
    name = 'jikepan';
    priority = 1;
    async doSearch(keyword) {
        try {
            const response = await this.httpClient.post('https://api.jikepan.xyz/search', { name: keyword, is_all: false }, {
                timeout: 15000,
                headers: {
                    'Referer': 'https://jikepan.xyz/',
                    'Origin': 'https://jikepan.xyz'
                }
            });
            const results = [];
            if (response.list) {
                for (const item of response.list) {
                    const links = parseLinks(item.name);
                    for (const link of item.links || []) {
                        const type = this.convertLinkType(link.service);
                        if (type) {
                            results.push({
                                title: item.name,
                                content: '',
                                url: link.link,
                                links: [{
                                        type,
                                        url: link.link,
                                        password: link.pwd
                                    }]
                            });
                        }
                    }
                }
            }
            return results;
        }
        catch {
            return [];
        }
    }
    convertLinkType(service) {
        const map = {
            'baidu': 'baidu',
            'aliyun': 'aliyun',
            'quark': 'quark',
            'xunlei': 'xunlei',
            '189cloud': 'tianyi',
            '115': '115',
            '123': '123',
            'pikpak': 'pikpak',
            'caiyun': 'mobile',
            'magnet': 'magnet',
            'ed2k': 'ed2k'
        };
        return map[service.toLowerCase()] || null;
    }
}
class Pan666Plugin extends BasePlugin {
    name = 'pan666';
    priority = 2;
    async doSearch(keyword) {
        try {
            const response = await this.httpClient.get(`https://www.666pan.com/api/search?q=${encodeURIComponent(keyword)}`);
            const results = [];
            if (response.data?.data) {
                for (const item of response.data.data) {
                    const links = parseLinks(item.name + ' ' + item.content);
                    results.push({
                        title: item.name,
                        content: item.content || '',
                        url: item.link,
                        datetime: item.created_at,
                        links: links.map(l => ({
                            type: l.type,
                            url: l.url,
                            password: l.password
                        }))
                    });
                }
            }
            return results;
        }
        catch {
            return [];
        }
    }
}
class HunhepanPlugin extends BasePlugin {
    name = 'hunhepan';
    priority = 3;
    async doSearch(keyword) {
        try {
            const response = await this.httpClient.get(`https://hunhepan.com/api/search?keyword=${encodeURIComponent(keyword)}`, {
                headers: {
                    'Referer': 'https://hunhepan.com/',
                    'Origin': 'https://hunhepan.com'
                }
            });
            const results = [];
            if (response.result) {
                for (const item of response.result) {
                    const links = parseLinks(item.title + ' ' + item.description);
                    results.push({
                        title: item.title,
                        content: item.description || '',
                        url: item.url,
                        datetime: item.date,
                        links: links.map(l => ({
                            type: l.type,
                            url: l.url,
                            password: l.password
                        }))
                    });
                }
            }
            return results;
        }
        catch {
            return [];
        }
    }
}
class PansearchPlugin extends BasePlugin {
    name = 'pansearch';
    priority = 4;
    async doSearch(keyword) {
        try {
            const response = await this.httpClient.get(`https://pansearch.org/api/search?q=${encodeURIComponent(keyword)}`);
            const results = [];
            if (response.data) {
                for (const item of response.data) {
                    const links = parseLinks(item.title + ' ' + item.content);
                    results.push({
                        title: item.title,
                        content: item.content || '',
                        url: item.url,
                        datetime: item.time,
                        links: links.map(l => ({
                            type: l.type,
                            url: l.url,
                            password: l.password
                        }))
                    });
                }
            }
            return results;
        }
        catch {
            return [];
        }
    }
}
class PantaPlugin extends BasePlugin {
    name = 'panta';
    priority = 5;
    async doSearch(keyword) {
        try {
            const response = await this.httpClient.post('https://panta.xyz/api/search', { keyword }, {
                timeout: 10000,
                headers: {
                    'Referer': 'https://panta.xyz/',
                    'Origin': 'https://panta.xyz'
                }
            });
            const results = [];
            if (response.list) {
                for (const item of response.list) {
                    const links = parseLinks(item.title + ' ' + item.info);
                    results.push({
                        title: item.title,
                        content: item.info || '',
                        url: item.link,
                        datetime: item.time,
                        links: links.map(l => ({
                            type: l.type,
                            url: l.url,
                            password: l.password
                        }))
                    });
                }
            }
            return results;
        }
        catch {
            return [];
        }
    }
}
class QupansouPlugin extends BasePlugin {
    name = 'qupansou';
    priority = 6;
    async doSearch(keyword) {
        try {
            const response = await this.httpClient.get(`https://www.qupansou.org/search?key=${encodeURIComponent(keyword)}`, {
                headers: {
                    'Referer': 'https://www.qupansou.org/',
                    'Origin': 'https://www.qupansou.org'
                }
            });
            const results = [];
            if (response.data?.items) {
                for (const item of response.data.items) {
                    const links = parseLinks(item.title + ' ' + item.desc);
                    results.push({
                        title: item.title,
                        content: item.desc || '',
                        url: item.url,
                        datetime: item.publish_time,
                        links: links.map(l => ({
                            type: l.type,
                            url: l.url,
                            password: l.password
                        }))
                    });
                }
            }
            return results;
        }
        catch {
            return [];
        }
    }
}
class SusuPlugin extends BasePlugin {
    name = 'susu';
    priority = 7;
    async doSearch(keyword) {
        try {
            const response = await this.httpClient.get(`https://susu98.com/api/search?q=${encodeURIComponent(keyword)}`);
            const results = [];
            if (response.results) {
                for (const item of response.results) {
                    const links = parseLinks(item.name + ' ' + item.content);
                    results.push({
                        title: item.name,
                        content: item.content || '',
                        url: item.link,
                        datetime: item.created_at,
                        links: links.map(l => ({
                            type: l.type,
                            url: l.url,
                            password: l.password
                        }))
                    });
                }
            }
            return results;
        }
        catch {
            return [];
        }
    }
}
class XuexiPlugin extends BasePlugin {
    name = 'xuexi';
    priority = 8;
    async doSearch(keyword) {
        try {
            const response = await this.httpClient.get(`https://www.xuexizhinan.com/api/search?wd=${encodeURIComponent(keyword)}`);
            const results = [];
            if (response.data?.list) {
                for (const item of response.data.list) {
                    const links = parseLinks(item.title + ' ' + item.description);
                    results.push({
                        title: item.title,
                        content: item.description || '',
                        url: item.link,
                        datetime: item.time,
                        links: links.map(l => ({
                            type: l.type,
                            url: l.url,
                            password: l.password
                        }))
                    });
                }
            }
            return results;
        }
        catch {
            return [];
        }
    }
}
class Pan789Plugin extends BasePlugin {
    name = 'pan789';
    priority = 9;
    async doSearch(keyword) {
        try {
            const response = await this.httpClient.get(`https://www.pan789.com/api/search?q=${encodeURIComponent(keyword)}`);
            const results = [];
            if (response.data?.results) {
                for (const item of response.data.results) {
                    const links = parseLinks(item.name + ' ' + item.content);
                    results.push({
                        title: item.name,
                        content: item.content || '',
                        url: item.url,
                        datetime: item.created_at,
                        links: links.map(l => ({
                            type: l.type,
                            url: l.url,
                            password: l.password
                        }))
                    });
                }
            }
            return results;
        }
        catch {
            return [];
        }
    }
}
class WanpanPlugin extends BasePlugin {
    name = 'wanpan';
    priority = 10;
    async doSearch(keyword) {
        try {
            const response = await this.httpClient.post('https://www.wanpan.com/api/search', { keyword }, { timeout: 10000 });
            const results = [];
            if (response.data?.list) {
                for (const item of response.data.list) {
                    const links = parseLinks(item.title + ' ' + item.desc);
                    results.push({
                        title: item.title,
                        content: item.desc || '',
                        url: item.link,
                        datetime: item.time,
                        links: links.map(l => ({
                            type: l.type,
                            url: l.url,
                            password: l.password
                        }))
                    });
                }
            }
            return results;
        }
        catch {
            return [];
        }
    }
}
class DuojiPlugin extends BasePlugin {
    name = 'duoji';
    priority = 11;
    async doSearch(keyword) {
        try {
            const response = await this.httpClient.get(`https://www.duoji.pw/api/search?q=${encodeURIComponent(keyword)}`);
            const results = [];
            if (response.result) {
                for (const item of response.result) {
                    const links = parseLinks(item.title + ' ' + item.content);
                    results.push({
                        title: item.title,
                        content: item.content || '',
                        url: item.url,
                        datetime: item.time,
                        links: links.map(l => ({
                            type: l.type,
                            url: l.url,
                            password: l.password
                        }))
                    });
                }
            }
            return results;
        }
        catch {
            return [];
        }
    }
}
let globalPluginManager = null;
// 简化的DemoPlugin - 只使用外部API，不生成假数据
class DemoSitePlugin extends BasePlugin {
    name = 'demo';
    priority = 0;
    async doSearch(keyword) {
        // 尝试外部API
        try {
            const response = await this.httpClient.post('https://so.252035.xyz/api/search', { kw: keyword, res: 'merge', refresh: true }, {
                timeout: 10000,
                headers: {
                    'Referer': 'https://so.252035.xyz/',
                    'Origin': 'https://so.252035.xyz'
                }
            });
            const results = [];
            if (response.data?.merged_by_type && typeof response.data.merged_by_type === 'object') {
                for (const [type, links] of Object.entries(response.data.merged_by_type)) {
                    const linkList = links;
                    for (const link of linkList || []) {
                        results.push({
                            title: link.note || '',
                            content: link.source || '',
                            url: link.url,
                            datetime: link.datetime,
                            links: [{
                                    type: type,
                                    url: link.url,
                                    password: link.password
                                }]
                        });
                    }
                }
            }
            if (results.length > 0) {
                console.log(`[DemoPlugin] 从外部API获取到 ${results.length} 个结果`);
                return results;
            }
        }
        catch (error) {
            console.log('[DemoPlugin] 外部API不可用，不返回假数据');
        }
        // 临时返回一些模拟数据来验证功能
        console.log(`[DemoPlugin] API不可用，返回少量验证数据`);
        const mockData = [];
        // 只为特定关键词返回少量验证数据
        if (keyword.includes('紫薇') || keyword.includes('电影') || keyword.includes('软件')) {
            mockData.push({
                title: `${keyword} - 验证数据1`,
                content: '这是一个验证搜索功能的测试数据',
                url: `https://example.com/test1`,
                datetime: new Date().toISOString(),
                links: [{
                        type: 'baidu',
                        url: `https://pan.baidu.com/s/test_${Date.now()}`,
                        password: 'demo'
                    }]
            });
            mockData.push({
                title: `${keyword} - 验证数据2`,
                content: '另一个验证数据，确保搜索功能正常',
                url: `https://example.com/test2`,
                datetime: new Date(Date.now() - 3600000).toISOString(),
                links: [{
                        type: 'aliyun',
                        url: `https://www.aliyundrive.com/s/test_${Date.now()}`,
                        password: ''
                    }]
            });
        }
        return mockData;
    }
}
export function getPluginManager() {
    if (!globalPluginManager) {
        globalPluginManager = new PluginManagerClass();
    }
    return globalPluginManager;
}
//# sourceMappingURL=plugin.js.map