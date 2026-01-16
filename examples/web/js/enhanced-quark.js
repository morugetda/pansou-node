// 增强版夸克网盘下载处理器
class EnhancedQuarkHandler {
    constructor() {
        this.alternatives = [];
        this.downloadMethods = [];
    }

    async handleQuarkDownload(url, filename) {
        console.log('[EnhancedQuark] 处理夸克网盘下载:', filename);
        
        // 尝试多种方法
        const results = [];
        
        // 方法1: 尝试获取直接下载链接
        results.push(await this.tryDirectLink(url, filename));
        
        // 方法2: 使用第三方解析服务
        results.push(await this.tryThirdPartyParser(url, filename));
        
        // 方法3: 使用浏览器扩展技巧
        results.push(await this.tryBrowserTricks(url, filename));
        
        // 方法4: 显示替代方案
        results.push(await this.showAlternatives(url, filename));
        
        return this.selectBestMethod(results);
    }

    // 方法1: 尝试获取直接下载链接
    async tryDirectLink(url, filename) {
        try {
            console.log('[DirectLink] 尝试获取直接下载链接...');
            
            // 尝试访问夸克API获取文件信息
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://pan.quark.cn/',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                }
            });

            if (response.ok) {
                const html = await response.text();
                
                // 尝试提取分享码和文件ID
                const shareId = this.extractShareId(html);
                const fileId = this.extractFileId(html);
                
                if (shareId && fileId) {
                    const directUrl = await this.constructDirectUrl(shareId, fileId);
                    if (directUrl) {
                        return {
                            method: 'direct',
                            success: true,
                            url: directUrl,
                            message: '找到直接下载链接'
                        };
                    }
                }
            }
        } catch (error) {
            console.log('[DirectLink] 直接链接获取失败:', error.message);
        }
        
        return { method: 'direct', success: false, message: '无法获取直接下载链接' };
    }

    // 方法2: 第三方解析服务
    async tryThirdPartyParser(url, filename) {
        const parsers = [
            {
                name: 'Quark Parser 1',
                url: 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url)
            },
            {
                name: 'Quark Parser 2', 
                url: 'https://r.jina.ai/http://' + url.replace('https://', '')
            },
            {
                name: 'Quark Parser 3',
                url: 'https://cors-anywhere.herokuapp.com/' + url
            }
        ];

        for (const parser of parsers) {
            try {
                console.log('[ThirdParty] 尝试解析器:', parser.name);
                
                const response = await fetch(parser.url, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                if (response.ok) {
                    const data = await response.text();
                    const downloadLinks = this.extractDownloadLinks(data);
                    
                    if (downloadLinks.length > 0) {
                        return {
                            method: 'third-party',
                            success: true,
                            parser: parser.name,
                            links: downloadLinks,
                            message: '通过第三方解析器找到下载链接'
                        };
                    }
                }
            } catch (error) {
                console.log(`[ThirdParty] ${parser.name} 失败:`, error.message);
            }
        }
        
        return { method: 'third-party', success: false, message: '第三方解析器都失败了' };
    }

    // 方法3: 浏览器技巧
    async tryBrowserTricks(url, filename) {
        console.log('[BrowserTricks] 尝试浏览器技巧...');
        
        const tricks = [
            () => this.tryNoIncognitoMode(url, filename),
            () => this.tryRefererSpoofing(url, filename),
            () => this.tryMobileUserAgent(url, filename),
            () => this.tryCookieBypass(url, filename)
        ];

        for (const trick of tricks) {
            try {
                const result = await trick();
                if (result.success) {
                    return result;
                }
            } catch (error) {
                console.log('[BrowserTricks] 技巧失败:', error.message);
            }
        }
        
        return { method: 'browser-tricks', success: false, message: '浏览器技巧都失败了' };
    }

    // 技巧1: 无痕模式
    async tryNoIncognitoMode(url, filename) {
        // 创建一个新的无痕窗口
        const noIncognitoUrl = url + '?no_incognito=' + Date.now();
        
        const modal = this.createDownloadModal('无痕模式下载', `
            <h3>🔓 无痕模式下载技巧</h3>
            <p><strong>步骤:</strong></p>
            <ol>
                <li>按 <kbd>Ctrl+Shift+N</kbd> (Chrome) 或 <kbd>Ctrl+Shift+P</kbd> (Firefox)</li>
                <li>打开无痕/隐私窗口</li>
                <li>粘贴链接: <code>${url}</code></li>
                <li>无痕模式下可能不需要登录就能下载小文件</li>
            </ol>
            <button onclick="window.open('${noIncognitoUrl}', '_blank')" style="padding: 10px 20px; background: #4caf50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                🚀 打开无痕窗口
            </button>
        `);
        
        return { success: true, method: 'no-incognito', modal };
    }

    // 技巧2: Referer欺骗
    async tryRefererSpoofing(url, filename) {
        // 尝试使用不同的Referer
        const referers = [
            'https://www.google.com/',
            'https://www.baidu.com/',
            'https://www.bing.com/',
            'https://pan.quark.cn/',
            'https://www.quark.cn/'
        ];

        for (const referer of referers) {
            try {
                const response = await fetch(url, {
                    headers: {
                        'Referer': referer,
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                if (response.ok) {
                    const html = await response.text();
                    if (!html.includes('login') && !html.includes('登录')) {
                        return {
                            success: true,
                            method: 'referer-spoof',
                            referer: referer,
                            message: '使用Referer欺骗成功绕过登录'
                        };
                    }
                }
            } catch (error) {
                continue;
            }
        }

        return { success: false, message: 'Referer欺骗失败' };
    }

    // 技巧3: 移动端User Agent
    async tryMobileUserAgent(url, filename) {
        const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
        
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': mobileUA,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            });

            if (response.ok) {
                const html = await response.text();
                if (html.includes('mobile') || !html.includes('login')) {
                    return {
                        success: true,
                        method: 'mobile-ua',
                        message: '移动端User Agent绕过成功'
                    };
                }
            }
        } catch (error) {
            // 忽略错误
        }

        return { success: false, message: '移动端User Agent失败' };
    }

    // 技巧4: Cookie绕过
    async tryCookieBypass(url, filename) {
        const modal = this.createDownloadModal('Cookie绕过下载', `
            <h3>🍪 Cookie绕过下载技巧</h3>
            <p><strong>方法:</strong></p>
            <ol>
                <li>在浏览器中打开 <a href="${url}" target="_blank">夸克分享页面</a></li>
                <li>按 <kbd>F12</kbd> 打开开发者工具</li>
                <li>转到 "Application" > "Cookies" > "https://pan.quark.cn"</li>
                <li>复制所有Cookie值</li>
                <li>将Cookie粘贴到下方输入框</li>
            </ol>
            <textarea id="cookieInput" placeholder="粘贴Cookie值..." style="width: 100%; height: 100px; margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"></textarea>
            <button onclick="tryCookieBypassDownload('${url}', '${filename}')" style="padding: 10px 20px; background: #4caf50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                🚀 使用Cookie下载
            </button>
        `);
        
        return { success: true, method: 'cookie-bypass', modal };
    }

    // 方法4: 显示替代方案
    async showAlternatives(url, filename) {
        const alternatives = [
            {
                name: '搜索替代资源',
                description: '在其他网盘搜索相同资源',
                action: () => this.searchAlternative(filename)
            },
            {
                name: '使用其他下载工具',
                description: '使用专业下载工具如IDM、JDownloader等',
                action: () => this.showDownloadTools()
            },
            {
                name: '在线预览下载',
                description: '尝试在线预览后下载',
                action: () => this.tryOnlinePreview(url, filename)
            },
            {
                name: '寻求帮助',
                description: '在相关社区寻求下载帮助',
                action: () => this.showCommunityHelp()
            }
        ];

        const modal = this.createDownloadModal('替代下载方案', `
            <h3>🔄 夸克网盘替代下载方案</h3>
            <p>由于夸克网盘需要登录，这里提供几种替代方案:</p>
            ${alternatives.map((alt, i) => `
                <div style="background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 8px;">
                    <h4>${i + 1}. ${alt.name}</h4>
                    <p>${alt.description}</p>
                    <button onclick="${alt.action}" style="padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        尝试此方法
                    </button>
                </div>
            `).join('')}
            
            <div style="background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 8px; border: 1px solid #ffeaa7;">
                <h4>💡 推荐方案</h4>
                <p>1. 重新搜索相同资源，可能其他网盘有无需登录的分享</p>
                <p>2. 使用专业下载工具如 <strong>JDownloader 2</strong>，它支持夸克网盘解析</p>
                <p>3. 考虑使用夸克网盘的手机版，有时限制较少</p>
            </div>
        `);
        
        return { success: true, method: 'alternatives', modal };
    }

    // 工具方法
    extractShareId(html) {
        const match = html.match(/shareId["\']?\s*[:=]\s*["\']?([^"'\s]+)/);
        return match ? match[1] : null;
    }

    extractFileId(html) {
        const match = html.match(/fileId["\']?\s*[:=]\s*["\']?([^"'\s]+)/);
        return match ? match[1] : null;
    }

    extractDownloadLinks(html) {
        // 正则表达式匹配下载链接
        const linkRegex = /https:\/\/[^\s"']+\.(?:mp4|avi|mkv|pdf|zip|rar|7z|jpg|png|mp3)/g;
        return html.match(linkRegex) || [];
    }

    constructDirectUrl(shareId, fileId) {
        // 尝试构建直接下载URL
        return null; // 需要根据夸克的API文档实现
    }

    createDownloadModal(title, content) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 700px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <h3 style="margin: 0 0 20px 0; color: #333;">${title}</h3>
                <div>${content}</div>
                <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 20px; padding: 12px 24px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    关闭
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        return modal;
    }

    selectBestMethod(results) {
        // 选择成功率最高的方法
        const successful = results.filter(r => r.success);
        if (successful.length > 0) {
            // 优先级: direct > third-party > browser-tricks > alternatives
            const priority = ['direct', 'third-party', 'browser-tricks', 'alternatives'];
            for (const method of priority) {
                const result = successful.find(r => r.method === method);
                if (result) {
                    return result;
                }
            }
        }
        
        return results.find(r => r.method === 'alternatives') || results[0];
    }

    // 替代方案的具体实现
    searchAlternative(filename) {
        const keywords = filename.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, ' ');
        window.open(`https://www.google.com/search?q=${encodeURIComponent(keywords)}+下载+site:pan.baidu.com+OR+site:aliyundrive.com`, '_blank');
    }

    showDownloadTools() {
        const modal = this.createDownloadModal('专业下载工具', `
            <h3>🛠️ 推荐的专业下载工具</h3>
            <div style="background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 8px;">
                <h4>1. JDownloader 2 (推荐)</h4>
                <p>开源免费，支持网盘自动解析，夸克网盘支持良好</p>
                <button onclick="window.open('https://jdownloader.org/jdownloader2', '_blank')" style="padding: 8px 16px; background: #4caf50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    下载JDownloader 2
                </button>
            </div>
            <div style="background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 8px;">
                <h4>2. IDM (Internet Download Manager)</h4>
                <p>付费但功能强大，支持浏览器集成</p>
                <button onclick="window.open('https://www.internetdownloadmanager.com/', '_blank')" style="padding: 8px 16px; background: #ff9800; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    访问IDM官网
                </button>
            </div>
            <div style="background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 8px;">
                <h4>3. aria2c (命令行)</h4>
                <p>免费开源，支持多线程，需要技术基础</p>
                <code>aria2c "${url}"</code>
            </div>
        `);
    }

    tryOnlinePreview(url, filename) {
        window.open(url + '?preview=1', '_blank');
    }

    showCommunityHelp() {
        window.open('https://www.google.com/search?q=' + encodeURIComponent('夸克网盘免登录下载方法'), '_blank');
    }
}

// 全局处理器
window.enhancedQuarkHandler = new EnhancedQuarkHandler();

// 导出全局函数
window.tryCookieBypassDownload = async function(url, filename) {
    const cookieInput = document.getElementById('cookieInput');
    const cookies = cookieInput ? cookieInput.value : '';
    
    if (!cookies) {
        alert('请先输入Cookie值');
        return;
    }
    
    try {
        const response = await fetch(url, {
            headers: {
                'Cookie': cookies,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (response.ok) {
            alert('Cookie验证成功，尝试下载...');
            // 这里可以进一步处理下载
        } else {
            alert('Cookie验证失败，请检查Cookie是否正确');
        }
    } catch (error) {
        alert('Cookie下载失败: ' + error.message);
    }
};

console.log('增强版夸克网盘处理器已加载');