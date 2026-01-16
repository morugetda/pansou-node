// 下载队列管理器
class DownloadQueueManager {
    constructor() {
        this.queues = {};
        this.activeDownloads = 0;
        this.maxConcurrent = 2;
        this.downloadHistory = [];
    }

    // 创建下载队列
    createQueue(name, options = {}) {
        this.queues[name] = {
            name,
            items: [],
            options: { ...options },
            isRunning: false,
            completed: 0,
            failed: 0
        };
        return this.queues[name];
    }

    // 添加到队列
    addToQueue(queueName, url, filename, options = {}) {
        const queue = this.queues[queueName];
        if (!queue) {
            console.error(`队列 ${queueName} 不存在`);
            return false;
        }

        queue.items.push({
            url,
            filename,
            options,
            status: 'pending', // pending, downloading, completed, failed
            progress: 0,
            error: null
        });

        return true;
    }

    // 开始下载队列
    async startQueue(queueName) {
        const queue = this.queues[queueName];
        if (!queue || queue.isRunning) return false;

        queue.isRunning = true;
        showToast(`🚀 开始下载队列: ${queueName}`, 'info');

        for (let i = 0; i < queue.items.length; i++) {
            const item = queue.items[i];
            
            if (this.activeDownloads >= this.maxConcurrent) {
                // 等待其他下载完成
                await this.waitForSlot();
            }

            // 启动下载
            this.downloadItem(queueName, item);
        }

        return true;
    }

    // 下载单个项目
    async downloadItem(queueName, item) {
        const queue = this.queues[queueName];
        item.status = 'downloading';
        this.activeDownloads++;

        try {
            await window.webDownloadHelper.downloadDirect(item.url, item.filename, item.options);
            item.status = 'completed';
            item.progress = 100;
            queue.completed++;
            
            this.downloadHistory.push({
                filename: item.filename,
                url: item.url,
                success: true,
                timestamp: new Date()
            });

        } catch (error) {
            item.status = 'failed';
            item.error = error.message;
            queue.failed++;
            
            this.downloadHistory.push({
                filename: item.filename,
                url: item.url,
                success: false,
                error: error.message,
                timestamp: new Date()
            });

        } finally {
            this.activeDownloads--;
            this.updateQueueUI(queueName);
        }
    }

    // 等待下载槽位
    waitForSlot() {
        return new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (this.activeDownloads < this.maxConcurrent) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 1000);
        });
    }

    // 更新队列UI
    updateQueueUI(queueName) {
        const queue = this.queues[queueName];
        const queueEl = document.getElementById(`queue-${queueName}`);
        
        if (!queueEl) return;

        const completedCount = queue.items.filter(item => item.status === 'completed').length;
        const totalCount = queue.items.length;

        let html = `
            <div class="queue-header">
                <h4>📦 ${queue.name}</h4>
                <span>进度: ${completedCount}/${totalCount} (${queue.completed}成功, ${queue.failed}失败)</span>
            </div>
            <div class="queue-items">
        `;

        queue.items.forEach((item, index) => {
            const statusIcon = {
                pending: '⏳',
                downloading: '🔄',
                completed: '✅',
                failed: '❌'
            }[item.status];

            const statusClass = item.status === 'completed' ? 'completed' : 
                               item.status === 'failed' ? 'failed' : 
                               item.status === 'downloading' ? 'downloading' : '';

            html += `
                <div class="queue-item ${statusClass}">
                    <div class="item-info">
                        <span class="item-icon">${statusIcon}</span>
                        <span class="item-name">${item.filename}</span>
                    </div>
                    ${item.status === 'downloading' ? `
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${item.progress}%"></div>
                        </div>
                    ` : ''}
                    ${item.error ? `<div class="item-error">${item.error}</div>` : ''}
                </div>
            `;
        });

        html += '</div>';
        queueEl.innerHTML = html;
    }

    // 获取队列状态
    getQueueStatus(queueName) {
        const queue = this.queues[queueName];
        if (!queue) return null;

        return {
            name: queue.name,
            total: queue.items.length,
            completed: queue.completed,
            failed: queue.failed,
            isRunning: queue.isRunning,
            items: queue.items
        };
    }

    // 清空队列
    clearQueue(queueName) {
        if (this.queues[queueName]) {
            delete this.queues[queueName];
            return true;
        }
        return false;
    }

    // 获取下载历史
    getHistory(limit = 50) {
        return this.downloadHistory.slice(-limit);
    }

    // 显示所有队列
    showAllQueues() {
        const container = document.getElementById('queue-container');
        if (!container) return;

        let html = '';
        Object.keys(this.queues).forEach(queueName => {
            const status = this.getQueueStatus(queueName);
            if (!status) return;

            html += `
                <div class="download-queue" id="queue-${queueName}">
                    <div class="queue-header">
                        <h3>📦 ${status.name}</h3>
                        <div class="queue-stats">
                            总计: ${status.total} | 完成: ${status.completed} | 失败: ${status.failed}
                            ${status.isRunning ? ' | 🔄 运行中' : ''}
                        </div>
                        <div class="queue-actions">
                            ${!status.isRunning ? `
                                <button class="btn btn-primary" onclick="queueManager.startQueue('${queueName}')">
                                    🚀 开始下载
                                </button>
                            ` : ''}
                            <button class="btn btn-secondary" onclick="queueManager.clearQueue('${queueName}')">
                                🗑️ 删除队列
                            </button>
                        </div>
                    </div>
                    <div class="queue-items">
                        <!-- 队列项目将在这里动态更新 -->
                    </div>
                </div>
            `;
        });

        container.innerHTML = html || '<p style="text-align: center; color: #666;">暂无下载队列</p>';
    }
}

// 全局队列管理器
window.queueManager = new DownloadQueueManager();

// 添加队列样式
const queueStyles = `
<style>
.download-queue {
    background: white;
    border-radius: 15px;
    padding: 20px;
    margin: 20px 0;
    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
}

.queue-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 15px;
    border-bottom: 1px solid #e0e0e0;
    margin-bottom: 15px;
}

.queue-header h3 {
    margin: 0;
    color: #333;
}

.queue-stats {
    color: #666;
    font-size: 14px;
}

.queue-actions {
    display: flex;
    gap: 10px;
}

.queue-items {
    max-height: 400px;
    overflow-y: auto;
}

.queue-item {
    display: flex;
    flex-direction: column;
    padding: 12px;
    margin: 8px 0;
    border-radius: 8px;
    background: #f9f9f9;
    border-left: 4px solid #e0e0e0;
    transition: all 0.3s;
}

.queue-item.downloading {
    border-left-color: #2196f3;
    background: #e3f2fd;
}

.queue-item.completed {
    border-left-color: #4caf50;
    background: #e8f5e9;
}

.queue-item.failed {
    border-left-color: #f44336;
    background: #ffebee;
}

.item-info {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 5px;
}

.item-icon {
    font-size: 16px;
}

.item-name {
    flex: 1;
    font-weight: 500;
    color: #333;
}

.progress-bar {
    height: 4px;
    background: #e0e0e0;
    border-radius: 2px;
    overflow: hidden;
    margin-top: 8px;
}

.progress-fill {
    height: 100%;
    background: #4caf50;
    transition: width 0.3s ease;
    border-radius: 2px;
}

.item-error {
    color: #f44336;
    font-size: 12px;
    margin-top: 5px;
}
</style>
`;

// 注入样式
document.head.insertAdjacentHTML('beforeend', queueStyles);