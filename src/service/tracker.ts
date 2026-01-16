import { AxiosRequestConfig } from 'axios';
import { getHttpClient } from '../utils/http.js';

export interface DownloadTask {
  id: string;
  url: string;
  filename: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
  progress: number;
  speed: number;
  size: number;
  downloaded: number;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
  type: string;
  password?: string;
  path?: string;
}

export interface DownloadStats {
  total: number;
  completed: number;
  failed: number;
  downloading: number;
  totalSize: number;
  totalDownloaded: number;
  averageSpeed: number;
}

export interface Aria2Status {
  gid: string;
  status: 'active' | 'waiting' | 'paused' | 'error' | 'complete' | 'removed';
  totalLength: string;
  completedLength: string;
  downloadSpeed: string;
  files: Array<{
    index: number;
    path: string;
    length: string;
    completedLength: string;
    selected: boolean;
    uris: Array<{
      uri: string;
      status: string;
    }>;
  }>;
}

export class DownloadTracker {
  private tasks: Map<string, DownloadTask> = new Map();
  private httpClient = getHttpClient();
  private aria2RpcUrl: string;
  private aria2Secret: string;
  private statsInterval: NodeJS.Timeout | null = null;

  constructor(aria2RpcUrl: string = 'http://localhost:6800/jsonrpc', aria2Secret: string = '') {
    this.aria2RpcUrl = aria2RpcUrl;
    this.aria2Secret = aria2Secret;
    this.startStatsMonitoring();
  }

  // 添加下载任务
  addTask(url: string, filename: string, type: string, password?: string): string {
    const id = this.generateTaskId();
    const task: DownloadTask = {
      id,
      url,
      filename,
      status: 'pending',
      progress: 0,
      speed: 0,
      size: 0,
      downloaded: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      type,
      password
    };

    this.tasks.set(id, task);
    return id;
  }

  // 更新任务状态
  updateTask(id: string, updates: Partial<DownloadTask>): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;

    Object.assign(task, updates, { updatedAt: new Date() });
    this.tasks.set(id, task);
    return true;
  }

  // 获取任务
  getTask(id: string): DownloadTask | undefined {
    return this.tasks.get(id);
  }

  // 获取所有任务
  getAllTasks(): DownloadTask[] {
    return Array.from(this.tasks.values());
  }

  // 获取任务统计
  getStats(): DownloadStats {
    const tasks = this.getAllTasks();
    const stats: DownloadStats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      downloading: tasks.filter(t => t.status === 'downloading').length,
      totalSize: tasks.reduce((sum, t) => sum + t.size, 0),
      totalDownloaded: tasks.reduce((sum, t) => sum + t.downloaded, 0),
      averageSpeed: tasks.reduce((sum, t) => sum + t.speed, 0) / Math.max(tasks.length, 1)
    };

    return stats;
  }

  // 删除任务
  removeTask(id: string): boolean {
    return this.tasks.delete(id);
  }

  // 清理旧任务
  cleanupOldTasks(olderThanDays: number = 30): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    
    let removed = 0;
    for (const [id, task] of this.tasks) {
      if (task.updatedAt < cutoff && (task.status === 'completed' || task.status === 'failed')) {
        this.tasks.delete(id);
        removed++;
      }
    }

    return removed;
  }

  // 同步 Aria2 状态
  async syncAria2Status(): Promise<void> {
    try {
      const aria2Tasks = await this.getAria2Tasks();
      
      for (const aria2Task of aria2Tasks) {
        const localTask = this.findTaskByUrl(aria2Task.files[0]?.uris[0]?.uri);
        if (!localTask) continue;

        const totalLength = parseInt(aria2Task.totalLength) || 0;
        const completedLength = parseInt(aria2Task.completedLength) || 0;
        const downloadSpeed = parseInt(aria2Task.downloadSpeed) || 0;
        const progress = totalLength > 0 ? (completedLength / totalLength) * 100 : 0;

        let status: DownloadTask['status'] = 'pending';
        switch (aria2Task.status) {
          case 'active':
            status = 'downloading';
            break;
          case 'complete':
            status = 'completed';
            break;
          case 'error':
            status = 'failed';
            break;
          case 'paused':
            status = 'paused';
            break;
        }

        this.updateTask(localTask.id, {
          status,
          progress: Math.round(progress),
          speed: downloadSpeed,
          size: totalLength,
          downloaded: completedLength,
          path: aria2Task.files[0]?.path
        });
      }
    } catch (error) {
      console.error('[DownloadTracker] 同步 Aria2 状态失败:', error);
    }
  }

  // 获取 Aria2 任务列表
  private async getAria2Tasks(): Promise<Aria2Status[]> {
    try {
      const response = await this.httpClient.post(this.aria2RpcUrl, {
        jsonrpc: '2.0',
        id: 'pansou_tracker',
        method: 'aria2.tellActive',
        params: this.aria2Secret ? [`token:${this.aria2Secret}`] : []
      });

      if (response.data.result) {
        return response.data.result;
      }
    } catch (error) {
      console.error('[DownloadTracker] 获取 Aria2 任务失败:', error);
    }

    return [];
  }

  // 查找任务
  private findTaskByUrl(url: string): DownloadTask | undefined {
    for (const task of this.tasks.values()) {
      if (task.url === url) {
        return task;
      }
    }
    return undefined;
  }

  // 生成任务ID
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 开始统计监控
  private startStatsMonitoring(): void {
    // 每30秒同步一次状态
    this.statsInterval = setInterval(() => {
      this.syncAria2Status();
    }, 30000);
  }

  // 停止监控
  stopMonitoring(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  // 导出任务数据
  exportTasks(): string {
    const tasks = this.getAllTasks();
    const exportData = {
      exportTime: new Date().toISOString(),
      stats: this.getStats(),
      tasks: tasks
    };
    return JSON.stringify(exportData, null, 2);
  }

  // 导入任务数据
  importTasks(data: string): number {
    try {
      const importData = JSON.parse(data);
      let imported = 0;

      if (importData.tasks && Array.isArray(importData.tasks)) {
        for (const taskData of importData.tasks) {
          const task: DownloadTask = {
            ...taskData,
            createdAt: new Date(taskData.createdAt),
            updatedAt: new Date(taskData.updatedAt)
          };
          this.tasks.set(task.id, task);
          imported++;
        }
      }

      return imported;
    } catch (error) {
      console.error('[DownloadTracker] 导入任务失败:', error);
      return 0;
    }
  }
}

// 单例模式
let trackerInstance: DownloadTracker | null = null;

export function getDownloadTracker(aria2RpcUrl?: string, aria2Secret?: string): DownloadTracker {
  if (!trackerInstance) {
    trackerInstance = new DownloadTracker(aria2RpcUrl, aria2Secret);
  }
  return trackerInstance;
}

// 清理函数
export function cleanupDownloadTracker(): void {
  if (trackerInstance) {
    trackerInstance.stopMonitoring();
    trackerInstance = null;
  }
}