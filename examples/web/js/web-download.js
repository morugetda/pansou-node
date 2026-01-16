// 网盘下载助手 - 前端下载功能
(function() {
    'use strict';

    class WebDownloadHelper {
        constructor() {
            this.downloadQueue = [];
            this.isProcessing = false;
            this.maxConcurrent = 3;
            this.currentDownloads = 0;
        }

        // 直接下载
        async downloadDirect(url, filename, options = {}) {
            try {
                // 检测链接类型
                const linkType = this.detectLinkType(url);
                
                switch (linkType) {
                    case 'direct':
                        return await this.downloadDirectFile(url, filename, options);
                    case 'baidu':
                    case 'aliyun':
                    case 'quark':
                        return await this.downloadCloudFile(url, filename, linkType, options);
                    case 'magnet':
                        return await this.downloadMagnet(url, filename);
                    default:
                        return await this.downloadFallback(url, filename, options);
                }
            } catch (error) {
                console.error('下载失败:', error);
                throw error;
            }
        }

        // 检测链接类型
        detectLinkType(url) {
            if (url.startsWith('http') && !url.includes('pan.')) {
                return 'direct';
            }
            if (url.includes('pan.baidu.com') || url.includes('baidu.com/s/')) {
                return 'baidu';
            }
            if (url.includes('aliyundrive.com') || url.includes('alipan.com')) {
                return 'aliyun';
            }
            if (url.includes('pan.quark.cn') || url.includes('quark.cn/s/')) {
                return 'quark';
            }
            if (url.startsWith('magnet:')) {
                return 'magnet';
            }
            return 'unknown';
        }

        // 直接文件下载
        async downloadDirectFile(url, filename, options) {
            try {
                // 使用 fetch 下载
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': options.userAgent || navigator.userAgent,
                        'Referer': options.referer || window.location.origin
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                // 获取文件大小
                const contentLength = response.headers.get('content-length');
                const totalSize = contentLength ? parseInt(contentLength) : 0;

                // 创建下载流
                const reader = response.body.getReader();
                const stream = new ReadableStream({
                    start(controller) {
                        function pump() {
                            return reader.read().then(({ done, value }) => {
                                if (done) {
                                    controller.close();
                                    return;
                                }
                                controller.enqueue(value);
                                return pump();
                            });
                        }
                        return pump();
                    }
                });

                // 使用 StreamSaver 下载
                if (window.streamSaver && totalSize > 0) {
                    const fileStream = streamSaver.createWriteStream(filename, {
                        size: totalSize
                    });
                    
                    return new Promise((resolve, reject) => {
                        stream.pipeTo(fileStream)
                            .then(() => resolve({ success: true, filename }))
                            .catch(reject);
                    });
                } else {
                    // 回退到 Blob 下载
                    const blob = await new Response(stream).blob();
                    this.downloadBlob(blob, filename);
                    return { success: true, filename };
                }
            } catch (error) {
                // 回退到新窗口打开
                window.open(url, '_blank');
                return { success: true, method: 'fallback' };
            }
        }

        // 网盘文件下载
        async downloadCloudFile(url, filename, type, options) {
            try {
                // 调用后端 API 获取下载链接
                const response = await fetch('http://localhost:8080/api/download', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: url,
                        type: type,
                        password: options.password,
                        options: {
                            userAgent: options.userAgent,
                            referer: options.referer
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error(`API ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                
                if (data.success && data.directLink) {
                    // 使用解析后的直链下载
                    return await this.downloadDirectFile(data.directLink.url, filename, options);
                } else {
                    // 显示下载方案
                    this.showDownloadOptions(data, filename);
                    return { success: true, method: 'options' };
                }
            } catch (error) {
                console.error('网盘下载失败:', error);
                // 回退到直接打开
                window.open(url, '_blank');
                return { success: true, method: 'fallback' };
            }
        }

        // 磁力链接下载
        async downloadMagnet(url, filename) {
            try {
                // 尝试使用 WebTorrent
                if (window.WebTorrent) {
                    const client = new WebTorrent();
                    return new Promise((resolve, reject) => {
                        client.add(url, (torrent) => {
                            const file = torrent.files[0];
                            file.blob().then(blob => {
                                this.downloadBlob(blob, filename || file.name);
                                client.destroy();
                                resolve({ success: true, filename: file.name });
                            });
                        });
                    });
                } else {
                    // 回退到打开磁力链接
                    window.open(url, '_blank');
                    return { success: true, method: 'fallback' };
                }
            } catch (error) {
                window.open(url, '_blank');
                return { success: true, method: 'fallback' };
            }
        }

        // 回退下载
        async downloadFallback(url, filename, options) {
            // 创建隐藏的 iframe 下载
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = url;
            document.body.appendChild(iframe);
            
            // 5秒后移除 iframe
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 5000);
            
            return { success: true, method: 'iframe' };
        }

        // Blob 下载
        downloadBlob(blob, filename) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // 显示下载选项
        showDownloadOptions(data, filename) {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.8); z-index: 10000;
                display: flex; align-items: center; justify-content: center;
            `;
            
            let optionsHtml = '';
            if (data.downloadMethods) {
                if (data.downloadMethods.direct) {
                    optionsHtml += `
                        <button onclick="window.open('${data.downloadMethods.direct}', '_blank')" style="display: block; width: 100%; margin: 10px 0; padding: 15px; background: #4caf50; color: white; border: none; border-radius: 8px; cursor: pointer;">
                            🚀 直接下载
                        </button>
                    `;
                }
                
                if (data.downloadMethods.aria2c && data.downloadMethods.aria2c.length > 0) {
                    optionsHtml += `
                        <button onclick="copyAria2Command('${JSON.stringify(data.downloadMethods.aria2c).replace(/'/g, "\\'")}')" style="display: block; width: 100%; margin: 10px 0; padding: 15px; background: #ff9800; color: white; border: none; border-radius: 8px; cursor: pointer;">
                            🔧 复制 Aria2 命令
                        </button>
                    `;
                }
            }
            
            modal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 15px; max-width: 600px; width: 90%;">
                    <h3 style="margin: 0 0 20px 0;">📥 下载选项 - ${filename}</h3>
                    ${optionsHtml || '<p>暂无可用的下载方法</p>'}
                    <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 20px; padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        关闭
                    </button>
                </div>
            `;
            
            document.body.appendChild(modal);
        }

        // 添加到队列
        addToQueue(url, filename, options = {}) {
            this.downloadQueue.push({
                url,
                filename,
                options,
                id: Date.now() + Math.random(),
                status: 'pending'
            });
            
            this.processQueue();
        }

        // 处理队列
        async processQueue() {
            if (this.isProcessing || this.currentDownloads >= this.maxConcurrent) {
                return;
            }
            
            this.isProcessing = true;
            
            while (this.downloadQueue.length > 0 && this.currentDownloads < this.maxConcurrent) {
                const task = this.downloadQueue.shift();
                if (task) {
                    this.currentDownloads++;
                    task.status = 'downloading';
                    
                    try {
                        await this.downloadDirect(task.url, task.filename, task.options);
                        task.status = 'completed';
                    } catch (error) {
                        task.status = 'failed';
                        console.error('队列下载失败:', error);
                    } finally {
                        this.currentDownloads--;
                    }
                }
            }
            
            this.isProcessing = false;
        }

        // 获取队列状态
        getQueueStatus() {
            return {
                total: this.downloadQueue.length,
                downloading: this.currentDownloads,
                queue: this.downloadQueue
            };
        }
    }

    // 复制 Aria2 命令
    window.copyAria2Command = function(commands) {
        try {
            const cmds = JSON.parse(commands);
            const command = cmds[0]; // 取第一个命令
            navigator.clipboard.writeText(command).then(() => {
                alert('✅ Aria2 命令已复制到剪贴板');
            });
        } catch (error) {
            alert('❌ 复制失败');
        }
    };

    // 导出到全局
    window.webDownloadHelper = new WebDownloadHelper();
    
    console.log('✅ 网盘下载助手已加载');
})();