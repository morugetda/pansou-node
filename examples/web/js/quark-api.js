// 夸克网盘API测试工具
class QuarkApiTester {
    constructor() {
        this.baseUrl = 'https://pan.quark.cn';
        this.testResults = [];
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

    // 测试所有发现的API端点
    async testAllEndpoints() {
        console.log('[ApiTester] 开始测试所有API端点...');
        
        const endpoints = [
            // 文件列表API
            { name: 'filelist-1', url: '/file/api/filelist', method: 'GET' },
            { name: 'filelist-2', url: '/api/filelist', method: 'POST' },
            { name: 'filelist-3', url: '/v1/api/filelist', method: 'POST' },
            { name: 'filelist-4', url: '/drive/v1/filelist', method: 'POST' },
            { name: 'filelist-5', url: '/api/share/filelist', method: 'POST' },
            { name: 'filelist-6', url: '/v2/share/filelist', method: 'POST' },
            
            // 下载API
            { name: 'download-1', url: '/file/api/download', method: 'GET' },
            { name: 'download-2', url: '/api/download', method: 'POST' },
            { name: 'download-3', url: '/v1/api/download', method: 'POST' },
            { name: 'download-4', url: '/file/download', method: 'GET' },
            { name: 'download-5', url: '/download', method: 'POST' },
            
            // 搜索API
            { name: 'search-1', url: '/api/search', method: 'GET' },
            { name: 'search-2', url: '/v1/api/search', method: 'GET' },
            { name: 'search-3', url: '/drive/search', method: 'GET' },
            
            // 分享API
            { name: 'share-1', url: '/api/share/info', method: 'GET' },
            { name: 'share-2', url: '/v1/api/share/info', method: 'GET' },
            
            // 用户API
            { name: 'user-1', url: '/api/user/info', method: 'GET' },
            { name: 'user-2', url: '/v1/api/user/info', method: 'GET' },
            
            // CDN/下载API
            { name: 'cdn-1', url: 'https://dl.quark.cn', method: 'GET' },
            { name: 'cdn-2', url: 'https://download.quark.cn', method: 'GET' },
            { name: 'cdn-3', url: 'https://api.quark.cn', method: 'GET' }
        ];
        
        this.testResults = [];
        
        for (const endpoint of endpoints) {
            const result = await this.testEndpoint(endpoint);
            this.testResults.push(result);
            
            console.log(`[ApiTester] ${endpoint.name}:`, result.success ? '✅' : '❌', result.status);
        }
        
        console.log('[ApiTester] API测试完成，结果:');
        this.testResults.forEach(result => {
            console.log(`  ${result.name}:`, result.success ? '✅' : '❌', result.status, result.url || '');
        });
        
        return this.testResults;
    }

    // 测试单个端点
    async testEndpoint(endpoint) {
        try {
            const url = this.baseUrl + endpoint.url;
            const options = {
                method: endpoint.method,
                headers: this.headers
            };
            
            let testParams = {};
            
            // 为特定端点添加测试参数
            if (endpoint.name.includes('filelist')) {
                testParams = {
                    share_id: '03d62218a413', // 使用测试分享ID
                    page: 1,
                    size: 10
                };
            } else if (endpoint.name.includes('download')) {
                testParams = {
                    file_id: 'test_file_id',
                    share_id: '03d62218a413'
                };
            } else if (endpoint.name.includes('search')) {
                testParams = {
                    keyword: '测试',
                    page: 1,
                    size: 10
                };
            }
            
            // 添加查询参数
            if (endpoint.method === 'GET' && Object.keys(testParams).length > 0) {
                url += '?' + new URLSearchParams(testParams).toString();
            }
            
            // 添加请求体
            if (endpoint.method === 'POST' && Object.keys(testParams).length > 0) {
                options.body = JSON.stringify(testParams);
                options.headers['Content-Type'] = 'application/json';
            }
            
            const startTime = Date.now();
            const response = await fetch(url, options);
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            const result = {
                name: endpoint.name,
                url: url,
                method: endpoint.method,
                success: response.ok,
                status: response.status,
                statusText: response.statusText,
                responseTime: responseTime,
                headers: Object.fromEntries(response.headers.entries()),
                contentType: response.headers.get('content-type'),
                contentLength: response.headers.get('content-length')
            };
            
            // 尝试获取响应内容
            try {
                const text = await response.text();
                result.contentLength = text.length;
                
                // 如果是JSON，尝试解析
                if (result.contentType && result.contentType.includes('json')) {
                    result.data = JSON.parse(text);
                } else {
                    result.rawContent = text.substring(0, 1000); // 只保存前1000字符
                }
            } catch (error) {
                result.contentError = error.message;
            }
            
            return result;
            
        } catch (error) {
            return {
                name: endpoint.name,
                url: this.baseUrl + endpoint.url,
                method: endpoint.method,
                success: false,
                error: error.message,
                status: 0,
                statusText: error.message
            };
        }
    }

    // 测试特定参数的API
    async testApiWithParams(endpoint, params) {
        try {
            const url = this.baseUrl + endpoint;
            const options = {
                method: 'POST',
                headers: this.headers
            };
            
            options.body = JSON.stringify(params);
            options.headers['Content-Type'] = 'application/json';
            
            const response = await fetch(url, options);
            
            const result = await this.parseApiResponse(response);
            
            return {
                endpoint,
                params,
                ...result
            };
            
        } catch (error) {
            return {
                endpoint,
                params,
                success: false,
                error: error.message
            };
        }
    }

    // 解析API响应
    async parseApiResponse(response) {
        const result = {
            success: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        };
        
        try {
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('json')) {
                result.data = await response.json();
                
                // 尝试提取常见的数据结构
                if (result.data.data) {
                    result.files = result.data.data.list || result.data.data.files || result.data.data.items;
                } else if (result.data.result) {
                    result.files = result.data.result.list || result.data.result.files || result.data.result.items;
                } else if (Array.isArray(result.data)) {
                    result.files = result.data;
                }
                
                if (result.files && Array.isArray(result.files)) {
                    result.fileCount = result.files.length;
                }
            } else {
                const text = await response.text();
                result.rawContent = text.substring(0, 1000);
            }
            
        } catch (error) {
            result.parseError = error.message;
        }
        
        return result;
    }

    // 自动发现新API端点
    async discoverNewEndpoints(baseUrl) {
        console.log('[ApiTester] 发现新API端点...');
        
        const commonPaths = [
            '/api/v2/',
            '/v2/api/',
            '/v3/api/',
            '/cloud/api/',
            '/drive/api/',
            '/file/api/v2/',
            '/api/v2/file/',
            '/v2/file/api/',
            '/cloud/drive/api/',
            '/drive/cloud/api/',
            '/api/v2/share/',
            '/share/api/v2/',
            '/user/api/v2/'
        ];
        
        const discovered = [];
        
        for (const path of commonPaths) {
            const endpoints = [
                { path: path + 'filelist', method: 'POST' },
                { path: path + 'download', method: 'POST' },
                { path: path + 'search', method: 'GET' },
                { path: path + 'share', method: 'POST' }
            ];
            
            for (const endpoint of endpoints) {
                try {
                    const fullUrl = baseUrl + endpoint.path;
                    const response = await fetch(fullUrl, {
                        method: 'HEAD',
                        headers: this.headers
                    });
                    
                    if (response.status !== 404) {
                        discovered.push({
                            path: endpoint.path,
                            method: endpoint.method,
                            status: response.status,
                            exists: true
                        });
                        
                        console.log(`[ApiTester] 发现新端点: ${endpoint.path} (${response.status})`);
                    }
                } catch (error) {
                    discovered.push({
                        path: endpoint.path,
                        method: endpoint.method,
                        status: 0,
                        exists: false,
                        error: error.message
                    });
                }
            }
        }
        
        return discovered;
    }

    // 生成测试报告
    generateTestReport() {
        const report = {
            timestamp: new Date().toISOString(),
            baseUrl: this.baseUrl,
            total: this.testResults.length,
            successful: this.testResults.filter(r => r.success).length,
            failed: this.testResults.filter(r => !r.success).length,
            endpoints: this.testResults
        };
        
        return report;
    }

    // 保存测试结果
    saveResults(filename = 'quark_api_test_results.json') {
        const report = this.generateTestReport();
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    // 性能测试
    async performanceTest(endpoint, iterations = 5) {
        console.log(`[ApiTester] 性能测试 ${endpoint.name}:`, iterations, '次');
        
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const startTime = Date.now();
            
            await this.testEndpoint(endpoint);
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            times.push(responseTime);
            
            console.log(`  测试 ${i + 1}:`, responseTime, 'ms');
        }
        
        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        
        console.log(`  平均响应时间:`, avgTime.toFixed(2), 'ms');
        console.log(`  最快响应时间:`, minTime, 'ms');
        console.log(`  最慢响应时间:`, maxTime, 'ms');
        
        return {
            endpoint: endpoint.name,
            iterations,
            times,
            avgTime,
            minTime,
            maxTime
        };
    }
}

// 全局API测试器实例
window.quarkApiTester = new QuarkApiTester();

// 导出全局函数
window.testAllEndpoints = async function() {
    return await window.quarkApiTester.testAllEndpoints();
};

window.testApiWithParams = async function(endpoint, params) {
    return await window.quarkApiTester.testApiWithParams(endpoint, params);
};

window.discoverNewEndpoints = async function(baseUrl) {
    return await window.quarkApiTester.discoverNewEndpoints(baseUrl || window.quarkApiTester.baseUrl);
};

window.saveResults = function(filename) {
    return window.quarkApiTester.saveResults(filename);
};

window.performanceTest = async function(endpoint) {
    return await window.quarkApiTester.performanceTest(endpoint);
};

window.generateTestReport = function() {
    return window.quarkApiTester.generateTestReport();
};

console.log('夸克网盘API测试器已加载');