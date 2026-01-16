// 智能网盘下载处理器
class CloudDownloadHandler {
    constructor() {
        this.downloadHistory = [];
    }

    // 处理不同网盘的下载
    async handleDownload(url, filename) {
        console.log(`[CloudDownload] 处理下载: ${filename} - ${url}`);
        
        const cloudType = this.detectCloudType(url);
        console.log(`[CloudDownload] 检测到网盘类型: ${cloudType}`);
        
        try {
            switch (cloudType) {
                case 'quark':
                    return await this.handleQuarkDownload(url, filename);
                case 'baidu':
                    return await this.handleBaiduDownload(url, filename);
                case 'aliyun':
                    return await this.handleAliyunDownload(url, filename);
                default:
                    return await this.handleGenericDownload(url, filename);
            }
        } catch (error) {
            console.error(`[CloudDownload] 下载失败: ${filename}`, error);
            return this.fallbackDownload(url, filename);
        }
    }

    // 检测网盘类型
    detectCloudType(url) {
        if (url.includes('pan.quark.cn')) return 'quark';
        if (url.includes('pan.baidu.com')) return 'baidu';
        if (url.includes('aliyundrive.com')) return 'aliyun';
        if (url.includes('115.com')) return '115';
        if (url.includes('tianyiyun.com')) return 'tianyi';
        return 'generic';
    }

    // 处理夸克网盘下载
    async handleQuarkDownload(url, filename) {
        console.log(`[CloudDownload] 夸克网盘下载开始`);
        
        // 方法1: 打开新标签页让用户手动下载
        const windowHandle = window.open(url, '_blank', 'width=800,height=600');
        
        // 显示用户指导
        this.showDownloadGuide('quark', filename, url, windowHandle);
        
        return { 
            success: true, 
            method: 'guided-manual',
            message: '已打开夸克网盘页面，请按页面提示下载'
        };
    }

    // 处理百度网盘下载
    async handleBaiduDownload(url, filename) {
        console.log(`[CloudDownload] 百度网盘下载开始`);
        
        const windowHandle = window.open(url, '_blank', 'width=800,height=600');
        this.showDownloadGuide('baidu', filename, url, windowHandle);
        
        return { 
            success: true, 
            method: 'guided-manual',
            message: '已打开百度网盘页面，请按页面提示下载'
        };
    }

    // 处理阿里云盘下载
    async handleAliyunDownload(url, filename) {
        console.log(`[CloudDownload] 阿里云盘下载开始`);
        
        const windowHandle = window.open(url, '_blank', 'width=800,height=600');
        this.showDownloadGuide('aliyun', filename, url, windowHandle);
        
        return { 
            success: true, 
            method: 'guided-manual',
            message: '已打开阿里云盘页面，请按页面提示下载'
        };
    }

    // 通用下载方法
    async handleGenericDownload(url, filename) {
        console.log(`[CloudDownload] 通用下载尝试`);
        
        try {
            // 尝试直接下载
            const response = await fetch(url);
            if (response.ok && response.headers.get('content-type')?.includes('application/')) {
                const blob = await response.blob();
                this.downloadBlob(blob, filename);
                return { success: true, method: 'direct' };
            }
        } catch (error) {
            console.log('直接下载失败，尝试iframe方法');
        }

        // 降级到iframe下载
        return await this.iframeDownload(url, filename);
    }

    // iframe下载
    async iframeDownload(url, filename) {
        return new Promise((resolve) => {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = url;
            
            iframe.onload = () => {
                setTimeout(() => {
                    if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                    }
                    resolve({ success: true, method: 'iframe', message: '已触发下载' });
                }, 3000);
            };
            
            document.body.appendChild(iframe);
        });
    }

    // 降级下载
    fallbackDownload(url, filename) {
        console.log(`[CloudDownload] 使用降级方案`);
        window.open(url, '_blank');
        return { success: true, method: 'fallback', message: '已在新标签页打开' };
    }

    // 显示下载指导
    showDownloadGuide(cloudType, filename, url, windowHandle) {
        const guide = this.getDownloadGuide(cloudType);
        
        // 创建指导弹窗
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <h3 style="margin: 0 0 20px 0; color: #333;">📥 下载指导</h3>
                
                <div style="margin-bottom: 20px;">
                    <strong>文件名:</strong> ${filename}
                </div>
                
                <div style="margin-bottom: 20px;">
                    <strong>网盘类型:</strong> ${this.getCloudTypeName(cloudType)}
                </div>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 15px 0;">下载步骤:</h4>
                    <ol style="margin: 0; padding-left: 20px; line-height: 1.8;">
                        ${guide.steps.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                </div>
                
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0;">💡 小贴士:</h4>
                    <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
                        ${guide.tips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button onclick="window.open('${url}', '_blank')" style="flex: 1; padding: 12px; background: #4caf50; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        🚀 重新打开网盘页面
                    </button>
                    <button onclick="navigator.clipboard.writeText('${url}')" style="flex: 1; padding: 12px; background: #2196f3; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        📋 复制链接
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="flex: 1; padding: 12px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        关闭
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 记录到历史
        this.downloadHistory.push({
            filename,
            url,
            cloudType,
            timestamp: new Date(),
            status: 'guided'
        });
    }

    // 获取下载指导
    getDownloadGuide(cloudType) {
        const guides = {
            quark: {
                steps: [
                    '已在新标签页打开夸克网盘分享页面',
                    '在页面中找到要下载的文件',
                    '点击文件右侧的"下载"按钮',
                    '如需要登录，可以使用手机号快速注册',
                    '选择下载方式（客户端下载或网页下载）'
                ],
                tips: [
                    '夸克网盘通常无需登录即可下载小文件',
                    '大文件可能需要下载夸克浏览器',
                    '也可以尝试点击"保存到网盘"后在线查看'
                ]
            },
            baidu: {
                steps: [
                    '已在新标签页打开百度网盘分享页面',
                    '输入提取码（如果有）',
                    '点击文件，在右侧面板选择下载',
                    '选择"普通下载"（无需登录）',
                    '如果提示安装客户端，可以点击"下载百度网盘客户端"的链接'
                ],
                tips: [
                    '小文件通常可以直接下载',
                    '大文件可能需要下载百度网盘客户端',
                    '可以使用"百度网盘网页版"进行下载'
                ]
            },
            aliyun: {
                steps: [
                    '已在新标签页打开阿里云盘分享页面',
                    '查看分享的文件列表',
                    '点击文件进入详情页',
                    '点击"下载"按钮',
                    '选择"高速下载"（需要登录）或"普通下载"'
                ],
                tips: [
                    '阿里云盘通常需要登录账号',
                    '可以使用支付宝账号快速登录',
                    '免费用户有下载速度限制'
                ]
            }
        };
        
        return guides[cloudType] || {
            steps: ['已在新标签页打开下载页面', '按照页面提示进行下载'],
            tips: ['如无法直接下载，请尝试登录或下载客户端']
        };
    }

    // 获取网盘类型名称
    getCloudTypeName(cloudType) {
        const names = {
            quark: '夸克网盘',
            baidu: '百度网盘',
            aliyun: '阿里云盘',
            '115': '115网盘',
            tianyi: '天翼云盘'
        };
        return names[cloudType] || '未知网盘';
    }

    // 下载blob
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 获取下载历史
    getHistory() {
        return this.downloadHistory;
    }

    // 清除历史
    clearHistory() {
        this.downloadHistory = [];
    }
}

// 全局下载处理器
window.cloudDownloadHandler = new CloudDownloadHandler();

// 导出为全局函数供HTML调用
window.downloadDirect = async function(url, filename) {
    console.log('开始智能下载:', filename, url);
    
    try {
        const result = await window.cloudDownloadHandler.handleDownload(url, filename);
        console.log('下载结果:', result);
        
        // 显示下载状态
        if (result.success) {
            showToast(`🚀 ${result.message}`, 'success');
        } else {
            showToast(`❌ 下载失败: ${result.message}`, 'error');
        }
        
    } catch (error) {
        console.error('下载过程中出错:', error);
        showToast(`❌ 下载过程中出错: ${error.message}`, 'error');
        
        // 最后的降级方案
        window.open(url, '_blank');
    }
};

// 更新app.js中的downloadDirect函数调用
function showDownloadStatus(message, type = 'info') {
    showToast(message, type);
}

console.log('智能网盘下载处理器已加载');