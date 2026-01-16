import axios from 'axios';
import { getConfig } from '../config.js';
export class HttpClient {
    client;
    constructor() {
        const config = getConfig();
        const axiosConfig = {
            timeout: config.pluginTimeout * 1000,
            validateStatus: () => true,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Referer': ''
            }
        };
        // 添加代理支持
        if (config.proxyURL) {
            const HttpsProxyAgent = require('https-proxy-agent');
            const HttpProxyAgent = require('http-proxy-agent');
            if (config.proxyURL.startsWith('socks5://')) {
                const { SocksProxyAgent } = require('socks-proxy-agent');
                axiosConfig.httpsAgent = new SocksProxyAgent(config.proxyURL);
                axiosConfig.httpAgent = new SocksProxyAgent(config.proxyURL);
            }
            else if (config.proxyURL.startsWith('https://')) {
                axiosConfig.httpsAgent = new HttpsProxyAgent(config.proxyURL);
                axiosConfig.httpAgent = new HttpProxyAgent(config.proxyURL);
            }
            else {
                axiosConfig.httpsAgent = new HttpsProxyAgent(config.proxyURL);
                axiosConfig.httpAgent = new HttpProxyAgent(config.proxyURL);
            }
        }
        this.client = axios.create(axiosConfig);
    }
    async get(url, options) {
        const response = await this.client.get(url, options);
        return response.data;
    }
    async post(url, data, options) {
        const response = await this.client.post(url, data, options);
        return response.data;
    }
    async request(options) {
        const response = await this.client.request(options);
        return response.data;
    }
}
let globalHttpClient = null;
export function getHttpClient() {
    if (!globalHttpClient) {
        globalHttpClient = new HttpClient();
    }
    return globalHttpClient;
}
//# sourceMappingURL=http.js.map