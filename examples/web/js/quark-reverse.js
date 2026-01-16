// 夸克网盘API逆向工程和自动解析
class QuarkReverseEngineer {
    constructor() {
        this.baseUrl = 'https://pan.quark.cn';
        this.apiEndpoints = {
            filelist: [
                '/file/api/filelist',
                '/api/filelist', 
                '/v1/api/filelist',
                '/drive/v1/filelist'
            ],
            download: [
                '/file/api/download',
                '/api/download',
                '/v1/api/download'
            ],
            share: [
                '/api/share/filelist',
                '/share/api/filelist',
                '/v2/share/filelist'
            ],
            search: [
                '/api/search',
                '/v1/api/search',
                '/drive/search'
            ]
        };
        
        this.sessionId = null;
        this.cookies = new Map();
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        };
    }

    // 逆向获取API端点
    async discoverApiEndpoints(shareUrl) {
        console.log('[Reverse] 开始逆向API端点...');
        
        const discovered = {
            filelist: [],
            download: [],
            share: []
        };
        
        try {
            // 1. 获取分享页面，分析其中的API调用
            const pageHtml = await this.fetchSharePage(shareUrl);
            const apiCalls = this.extractApiCalls(pageHtml);
            
            console.log('[Reverse] 发现的API调用:', apiCalls);
            
            // 2. 测试发现的API端点
            for (const apiCall of apiCalls) {
                if (apiCall.includes('filelist')) {
                    discovered.filelist.push(apiCall);
                } else if (apiCall.includes('download')) {
                    discovered.download.push(apiCall);
                } else if (apiCall.includes('share')) {
                    discovered.share.push(apiCall);
                }
            }
            
            // 3. 测试已知的API端点
            await this.testKnownEndpoints(discovered);
            
            return discovered;
            
        } catch (error) {
            console.error('[Reverse] API端点发现失败:', error);
            return discovered;
        }
    }

    // 提取页面中的API调用
    extractApiCalls(html) {
        const apiCalls = [];
        
        // 使用正则表达式提取API调用
        const patterns = [
            /['"`]([^'"`]*\/api\/[^'"`]*)['"`]/g,
            /api\/[a-zA-Z0-9\/_-]+/g,
            /\/v[0-9]\/api\/[a-zA-Z0-9\/_-]+/g,
            /file\/api\/[a-zA-Z0-9\/_-]+/g
        ];
        
        for (const pattern of patterns) {
            const matches = html.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    if (match.includes('api') && !apiCalls.includes(match)) {
                        apiCalls.push(match);
                    }
                });
            }
        }
        
        return [...new Set(apiCalls)]; // 去重
    }

    // 测试已知API端点
    async testKnownEndpoints(discovered) {
        console.log('[Reverse] 测试已知API端点...');
        
        for (const [type, endpoints] of Object.entries(this.apiEndpoints)) {
            for (const endpoint of endpoints) {
                const fullUrl = this.baseUrl + endpoint;
                
                try {
                    const response = await fetch(fullUrl, {
                        method: 'GET',
                        headers: this.headers
                    });
                    
                    if (response.status !== 404) {
                        discovered[type].push(endpoint);
                        console.log(`[Reverse] 发现可用端点: ${endpoint} (状态: ${response.status})`);
                    }
                } catch (error) {
                    console.log(`[Reverse] 端点测试失败: ${endpoint}`, error.message);
                }
            }
        }
    }

    // 自动构建文件列表API
    async buildFilelistApi(shareId) {
        console.log('[Reverse] 构建文件列表API...');
        
        const apiVariations = [
            // 基于观察的API结构
            {
                url: `${this.baseUrl}/file/api/filelist`,
                method: 'GET',
                params: `share_id=${shareId}`
            },
            {
                url: `${this.baseUrl}/file/api/filelist`,
                method: 'POST',
                body: JSON.stringify({ share_id: shareId })
            },
            {
                url: `${this.baseUrl}/v1/api/filelist`,
                method: 'POST',
                body: JSON.stringify({
                    share_id: shareId,
                    page: 1,
                    size: 100
                })
            },
            {
                url: `${this.baseUrl}/cloud/file/list`,
                method: 'POST',
                body: JSON.stringify({
                    share_id: shareId,
                    dir: ''
                })
            },
            // 尝试更多可能的API结构
            {
                url: `${this.baseUrl}/drive/v2/share/files`,
                method: 'POST',
                body: JSON.stringify({
                    share_id: shareId,
                    sort: 'name',
                    order: 'asc'
                })
            },
            {
                url: `${this.baseUrl}/api/share/v2/files`,
                method: 'POST',
                body: JSON.stringify({
                    share_id: shareId,
                    include_dir: true
                })
            }
        ];
        
        for (const variation of apiVariations) {
            try {
                console.log(`[Reverse] 测试API变体: ${variation.url}`);
                
                const options = {
                    method: variation.method,
                    headers: this.headers
                };
                
                if (variation.body) {
                    options.body = variation.body;
                    options.headers['Content-Type'] = 'application/json';
                }
                
                if (variation.params) {
                    variation.url += '?' + variation.params;
                }
                
                const response = await fetch(variation.url, options);
                
                if (response.ok) {
                    const data = await response.json();
                    const files = this.parseApiResponse(data);
                    
                    if (files && files.length > 0) {
                        console.log('[Reverse] API变体成功:', variation.url);
                        return {
                            url: variation.url,
                            method: variation.method,
                            body: variation.body,
                            params: variation.params,
                            files: files
                        };
                    }
                }
            } catch (error) {
                console.log('[Reverse] API变体失败:', error.message);
            }
        }
        
        return null;
    }

    // 自动构建下载API
    async buildDownloadApi(fileId, shareId) {
        console.log('[Reverse] 构建下载API...');
        
        const downloadVariations = [
            {
                url: `${this.baseUrl}/file/api/download`,
                method: 'GET',
                params: `file_id=${fileId}`
            },
            {
                url: `${this.baseUrl}/file/api/download`,
                method: 'POST',
                body: JSON.stringify({
                    file_id: fileId,
                    share_id: shareId
                })
            },
            {
                url: `${this.baseUrl}/api/v1/download`,
                method: 'POST',
                body: JSON.stringify({
                    file_id: fileId
                })
            },
            // 尝试直接下载链接模式
            {
                url: `${this.baseUrl}/file/${fileId}`,
                method: 'GET',
                params: 'type=download'
            },
            {
                url: `${this.baseUrl}/download`,
                method: 'POST',
                body: JSON.stringify({
                    file_id: fileId
                })
            },
            // 尝试CDN下载
            {
                url: `https://dl.quark.cn/${fileId}`,
                method: 'GET',
                params: `share_id=${shareId}`
            },
            {
                url: `https://download.quark.cn/${fileId}`,
                method: 'GET'
            }
        ];
        
        for (const variation of downloadVariations) {
            try {
                console.log(`[Reverse] 测试下载API: ${variation.url}`);
                
                const options = {
                    method: variation.method,
                    headers: {
                        ...this.headers,
                        'Referer': `${this.baseUrl}/s/${shareId}`
                    }
                };
                
                if (variation.body) {
                    options.body = variation.body;
                    options.headers['Content-Type'] = 'application/json';
                }
                
                if (variation.params) {
                    variation.url += '?' + variation.params;
                }
                
                const response = await fetch(variation.url, options);
                
                if (response.ok) {
                    const data = await response.json();
                    const downloadUrl = data.data?.url || data.url || data.download_url || data.link;
                    
                    if (downloadUrl) {
                        console.log('[Reverse] 下载API成功:', variation.url);
                        return {
                            url: variation.url,
                            method: variation.method,
                            downloadUrl: downloadUrl,
                            direct: true
                        };
                    }
                }
                
                // 检查是否是重定向
                if (response.redirected || response.status === 302 || response.status === 301) {
                    const redirectUrl = response.url || response.headers.get('location');
                    if (redirectUrl) {
                        console.log('[Reverse] 发现重定向:', redirectUrl);
                        return {
                            url: variation.url,
                            method: variation.method,
                            redirectUrl: redirectUrl,
                            redirect: true
                        };
                    }
                }
                
            } catch (error) {
                console.log('[Reverse] 下载API失败:', error.message);
            }
        }
        
        return null;
    }

    // 模拟夸克客户端请求
    async simulateClientRequest(url, options = {}) {
        console.log('[Reverse] 模拟客户端请求:', url);
        
        const clientHeaders = {
            ...this.headers,
            'X-Client-Platform': 'web',
            'X-Client-Version': '1.0.0',
            'X-Request-ID': this.generateRequestId(),
            'X-Timestamp': Date.now().toString(),
            ...options.headers
        };
        
        // 模拟夸克客户端的签名算法（如果有的话）
        const signature = this.generateSignature(url, options);
        if (signature) {
            clientHeaders['X-Signature'] = signature;
        }
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: clientHeaders
            });
            
            return response;
        } catch (error) {
            console.error('[Reverse] 客户端模拟失败:', error);
            throw error;
        }
    }

    // 生成请求ID
    generateRequestId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 生成签名（简化版本）
    generateSignature(url, options) {
        // 这里可以实现夸克的签名算法
        // 由于我们没有具体的算法，返回null
        return null;
    }

    // 批量测试API
    async batchTestApi(shareId) {
        console.log('[Reverse] 批量测试API...');
        
        const results = {
            filelist: [],
            download: [],
            search: []
        };
        
        // 测试文件列表API
        for (const endpoint of this.apiEndpoints.filelist) {
            const result = await this.testApiEndpoint(endpoint + '?share_id=' + shareId);
            if (result.success) {
                results.filelist.push({
                    endpoint,
                    ...result
                });
            }
        }
        
        return results;
    }

    // 测试单个API端点
    async testApiEndpoint(url) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: this.headers
            });
            
            return {
                success: response.ok,
                status: response.status,
                headers: Object.fromEntries(response.headers.entries()),
                url: url
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                url: url
            };
        }
    }

    // 持久化发现的API端点
    saveDiscoveredEndpoints(endpoints) {
        localStorage.setItem('quark_discovered_apis', JSON.stringify(endpoints));
        console.log('[Reverse] API端点已保存到本地存储');
    }

    // 加载已发现的API端点
    loadDiscoveredEndpoints() {
        try {
            const saved = localStorage.getItem('quark_discovered_apis');
            if (saved) {
                const endpoints = JSON.parse(saved);
                console.log('[Reverse] 从本地存储加载API端点');
                return endpoints;
            }
        } catch (error) {
            console.error('[Reverse] 加载API端点失败:', error);
        }
        
        return null;
    }

    // 解析API响应（通用）
    parseApiResponse(data) {
        try {
            // 尝试多种可能的响应格式
            const extractors = [
                () => data.data?.list || data.data?.files || data.data?.items,
                () => data.result?.list || data.result?.files || data.result?.items,
                () => data.list || data.files || data.items,
                () => Array.isArray(data) ? data : null,
                () => data.content?.list || data.content?.files || data.content?.items
            ];
            
            for (const extractor of extractors) {
                const items = extractor();
                if (Array.isArray(items) && items.length > 0) {
                    return items;
                }
            }
            
            return null;
        } catch (error) {
            console.error('[Reverse] 响应解析失败:', error);
            return null;
        }
    }
}

// 全局逆向工程实例
window.quarkReverseEngineer = new QuarkReverseEngineer();

console.log('夸克网盘逆向工程器已加载');