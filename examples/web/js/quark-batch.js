// 夸克网盘批量处理脚本
class QuarkBatchProcessor {
    constructor() {
        this.results = [];
        this.progress = 0;
        this.concurrency = 3; // 并发数量
    }

    // 批量解析多个分享链接
    async batchParse(shareUrls) {
        console.log('[Batch] 开始批量解析:', shareUrls.length, '个链接');
        this.results = [];
        this.progress = 0;

        const tasks = shareUrls.map((url, index) => 
            this.parseSingleUrl(url, index).catch(error => ({
                url,
                index,
                error: error.message,
                success: false
            }))
        );

        // 限制并发数量
        for (let i = 0; i < tasks.length; i += this.concurrency) {
            const batch = tasks.slice(i, i + this.concurrency);
            const results = await Promise.all(batch);
            
            results.forEach(result => {
                this.results[result.index] = result;
                this.progress++;
                this.logProgress();
            });
        }

        console.log('[Batch] 批量解析完成');
        return this.results;
    }

    // 解析单个URL
    async parseSingleUrl(shareUrl, index) {
        console.log(`[Batch][${index + 1}] 解析:`, shareUrl);
        
        try {
            // 使用自动解析器
            if (window.quarkParser) {
                const result = await window.quarkParser.init(shareUrl);
                
                if (result.success) {
                    // 获取下载链接
                    const downloadUrls = await window.quarkParser.getAllDownloadUrls();
                    
                    return {
                        url: shareUrl,
                        index,
                        success: true,
                        fileList: result.fileList,
                        downloadUrls: downloadUrls,
                        totalFiles: downloadUrls.length,
                        totalSize: downloadUrls.reduce((sum, file) => sum + (file.size || 0), 0)
                    };
                } else {
                    return {
                        url: shareUrl,
                        index,
                        success: false,
                        error: result.error
                    };
                }
            }
            
            throw new Error('自动解析器未加载');
            
        } catch (error) {
            console.error(`[Batch][${index + 1}] 解析失败:`, error.message);
            return {
                url: shareUrl,
                index,
                success: false,
                error: error.message
            };
        }
    }

    // 批量下载
    async batchDownload(items, options = {}) {
        const { maxConcurrent = 2, delay = 1000 } = options;
        console.log('[Batch] 开始批量下载:', items.length, '个文件');
        
        const successes = [];
        const failures = [];
        
        for (let i = 0; i < items.length; i += maxConcurrent) {
            const batch = items.slice(i, i + maxConcurrent);
            const promises = batch.map((item, batchIndex) => 
                this.downloadSingleFile(item, i + batchIndex)
            );
            
            const results = await Promise.allSettled(promises);
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value.success) {
                    successes.push(result.value);
                } else {
                    failures.push({
                        item: items[i + index],
                        error: result.reason?.message || '下载失败'
                    });
                }
            });
            
            // 延迟避免过载
            if (i + maxConcurrent < items.length) {
                await this.sleep(delay);
            }
        }
        
        return { successes, failures };
    }

    // 下载单个文件
    async downloadSingleFile(file, index) {
        try {
            console.log(`[Download][${index + 1}] 下载:`, file.name);
            
            // 尝试直接下载
            const response = await fetch(file.url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': 'https://pan.quark.cn/'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // 获取文件大小
            const contentLength = response.headers.get('content-length');
            const totalSize = contentLength ? parseInt(contentLength) : 0;
            
            // 下载文件
            const reader = response.body.getReader();
            const chunks = [];
            let downloaded = 0;
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                chunks.push(value);
                downloaded += value.length;
                
                // 更新进度
                const progress = totalSize > 0 ? Math.round((downloaded / totalSize) * 100) : 0;
                this.updateDownloadProgress(index, progress);
            }
            
            const blob = new Blob(chunks);
            const downloadUrl = URL.createObjectURL(blob);
            
            // 创建下载链接
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = file.name;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
            
            console.log(`[Download][${index + 1}] 下载完成:`, file.name);
            
            return {
                success: true,
                file: file,
                size: downloaded
            };
            
        } catch (error) {
            console.error(`[Download][${index + 1}] 下载失败:`, file.name, error.message);
            return {
                success: false,
                file: file,
                error: error.message
            };
        }
    }

    // 更新下载进度
    updateDownloadProgress(index, progress) {
        // 这里可以更新UI显示进度
        console.log(`[Progress][${index + 1}] ${progress}%`);
    }

    // 生成批量下载脚本
    generateBatchScript(items) {
        const script = `// 批量下载脚本
// 使用方法: 复制此代码到浏览器控制台执行

const downloadItems = ${JSON.stringify(items, null, 2)};

async function batchDownload() {
    console.log('开始批量下载', downloadItems.length, '个文件');
    
    const successes = [];
    const failures = [];
    
    for (let i = 0; i < downloadItems.length; i++) {
        const item = downloadItems[i];
        console.log(\`[\${i + 1}/${downloadItems.length}] 下载: \${item.name}\`);
        
        try {
            const response = await fetch(item.url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = item.name;
                a.click();
                URL.revokeObjectURL(url);
                
                successes.push(item);
                console.log(\`✅ 下载成功: \${item.name}\`);
            } else {
                failures.push({ item, error: \`HTTP \${response.status}\` });
                console.log(\`❌ 下载失败: \${item.name}\`);
            }
            
            // 间隔1秒下载下一个
            if (i < downloadItems.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
        } catch (error) {
            failures.push({ item, error: error.message });
            console.log(\`❌ 下载出错: \${item.name} - \${error.message}\`);
        }
    }
    
    console.log(\`批量下载完成: 成功 \${successes.length}, 失败 \${failures.length}\`);
}

// 执行批量下载
batchDownload();
`;
        
        return script;
    }

    // 生成JDownloader 2脚本
    generateJD2Script(items) {
        const script = `// JDownloader 2 批量下载脚本
// 使用方法: 复制此内容到JDownloader 2 的"链接抓取"功能

const downloadLinks = ${JSON.stringify(items.map(item => item.url), null, 2)};

console.log('JDownloader 2 链接数量:', downloadLinks.length);
console.log('复制以下链接到JDownloader 2:');

downloadLinks.forEach((link, index) => {
    console.log(\`\${index + 1}. \${link}\`);
});

console.log('\\n使用步骤:');
console.log('1. 打开JDownloader 2');
console.log('2. 进入"链接抓取"功能');
console.log('3. 粘贴上面的所有链接');
console.log('4. 点击"添加链接"开始下载');
console.log('5. JDownloader 2会自动解析夸克链接并下载文件');
`;
        
        return script;
    }

    // 生成aria2c命令
    generateAria2Commands(items) {
        const commands = [];
        
        items.forEach((item, index) => {
            const command = `aria2c \\
    --out="${item.name}" \\
    --user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \\
    --header="Referer: https://pan.quark.cn/" \\
    "${item.url}"`;
            
            commands.push(command);
        });
        
        return commands;
    }

    // 导出结果为JSON
    exportResults(filename = 'quark_batch_results.json') {
        const data = {
            timestamp: new Date().toISOString(),
            total: this.results.length,
            success: this.results.filter(r => r.success).length,
            failed: this.results.filter(r => !r.success).length,
            items: this.results
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    // 工具函数
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    logProgress() {
        const percentage = Math.round((this.progress / this.results.length) * 100);
        console.log(`[Progress] ${percentage}% (${this.progress}/${this.results.length})`);
    }
}

// 全局批量处理器实例
window.quarkBatchProcessor = new QuarkBatchProcessor();

// 导出全局函数
window.batchParse = async function(urls) {
    if (!Array.isArray(urls)) {
        urls = urls.split('\n').filter(u => u.trim());
    }
    return await window.quarkBatchProcessor.batchParse(urls);
};

window.exportResults = function(filename) {
    return window.quarkBatchProcessor.exportResults(filename);
};

console.log('夸克网盘批量处理器已加载');