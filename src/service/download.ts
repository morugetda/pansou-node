import { AxiosRequestConfig } from 'axios';
import { getHttpClient } from '../utils/http.js';

export interface DirectLink {
  url: string;
  filename?: string;
  size?: string;
  type: 'direct' | 'redirect' | 'script';
  password?: string;
  headers?: Record<string, string>;
}

export interface DownloadOptions {
  concurrent?: number;
  maxRetries?: number;
  timeout?: number;
  userAgent?: string;
  referer?: string;
}

export interface Aria2Config {
  rpcUrl?: string;
  rpcSecret?: string;
  options?: {
    'max-connection-per-server'?: number;
    'split'?: number;
    'min-split-size'?: string;
    'user-agent'?: string;
    'referer'?: string;
    'header'?: string[];
    'out'?: string;
    'dir'?: string;
  };
}

export class DownloadHelper {
  private httpClient = getHttpClient();

  async getDirectLink(originalUrl: string, type: string): Promise<DirectLink | null> {
    try {
      console.log(`[DownloadHelper] 解析链接: ${originalUrl}, 类型: ${type}`);
      
      // 根据不同网盘类型处理
      switch (type.toLowerCase()) {
        case 'baidu':
          return await this.parseBaiduLink(originalUrl);
        case 'aliyun':
          return await this.parseAliyunLink(originalUrl);
        case 'quark':
          return await this.parseQuarkLink(originalUrl);
        case 'tianyi':
          return await this.parseTianyiLink(originalUrl);
        case '115':
          return await this.parse115Link(originalUrl);
        case 'uc':
          return await this.parseUCLink(originalUrl);
        case 'xunlei':
          return await this.parseXunleiLink(originalUrl);
        default:
          return { url: originalUrl, type: 'direct' };
      }
    } catch (error) {
      console.error('[DownloadHelper] 解析失败:', error);
      return null;
    }
  }

  private async parseBaiduLink(url: string): Promise<DirectLink | null> {
    try {
      // 百度网盘直链提取
      const shareId = this.extractBaiduShareId(url);
      if (!shareId) return null;

      // 尝试获取分享页面
      const response = await this.httpClient.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://pan.baidu.com/'
        }
      });

      // 提取文件信息
      const filename = this.extractFilename(response.data);
      
      return {
        url: `https://pan.baidu.com/share/link?shareid=${shareId}&uk=0`,
        filename: filename || undefined,
        type: 'direct'
      };
    } catch {
      return { url, type: 'redirect' };
    }
  }

  private async parseAliyunLink(url: string): Promise<DirectLink | null> {
    try {
      // 阿里云盘分享链接处理
      const shareId = this.extractAliyunShareId(url);
      if (!shareId) return null;

      return {
        url: `https://www.aliyundrive.com/s/${shareId}`,
        type: 'direct'
      };
    } catch {
      return { url, type: 'redirect' };
    }
  }

  private async parseQuarkLink(url: string): Promise<DirectLink | null> {
    try {
      // 夸克网盘处理
      const shareId = this.extractQuarkShareId(url);
      if (!shareId) return null;

      return {
        url: `https://pan.quark.cn/s/${shareId}`,
        type: 'direct'
      };
    } catch {
      return { url, type: 'redirect' };
    }
  }

  private async parseTianyiLink(url: string): Promise<DirectLink | null> {
    return { url, type: 'redirect' };
  }

  private async parse115Link(url: string): Promise<DirectLink | null> {
    return { url, type: 'redirect' };
  }

  private async parseUCLink(url: string): Promise<DirectLink | null> {
    return { url, type: 'redirect' };
  }

  private async parseXunleiLink(url: string): Promise<DirectLink | null> {
    return { url, type: 'redirect' };
  }

  private extractBaiduShareId(url: string): string | null {
    const match = url.match(/\/s\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  private extractAliyunShareId(url: string): string | null {
    const match = url.match(/\/s\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  private extractQuarkShareId(url: string): string | null {
    const match = url.match(/\/s\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  private extractFilename(html: string): string | null {
    const match = html.match(/<title>(.*?)<\/title>/);
    return match ? match[1].replace('百度网盘-分享文件', '').trim() : null;
  }

  // 生成下载脚本
  generateDownloadScript(links: DirectLink[]): string {
    return `
// 批量下载脚本 - 在浏览器控制台运行
// 使用方法：复制此代码到浏览器控制台，然后调用 downloadAll()

function downloadAll() {
  const links = ${JSON.stringify(links, null, 2)};
  
  links.forEach((link, index) => {
    setTimeout(() => {
      console.log(\`准备下载: \${link.filename || '文件' + (index + 1)}\`);
      
      // 方法1: 直接打开链接
      window.open(link.url, '_blank');
      
      // 方法2: 创建隐藏下载
      // const a = document.createElement('a');
      // a.href = link.url;
      // a.download = link.filename || 'file_' + (index + 1);
      // document.body.appendChild(a);
      // a.click();
      // document.body.removeChild(a);
      
    }, index * 2000); // 每2秒下载一个
  });
  
  console.log('已开始下载 ' + links.length + ' 个文件');
}

// 一键下载调用
downloadAll();
    `.trim();
  }

  // 生成 aria2c 下载命令
  generateAria2Commands(links: DirectLink[], password?: string, options?: DownloadOptions): string[] {
    const commands: string[] = [];
    const concurrent = options?.concurrent || 5;
    const maxRetries = options?.maxRetries || 3;
    const timeout = options?.timeout || 600;
    const userAgent = options?.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    
    links.forEach((link, index) => {
      const filename = link.filename || `file_${index + 1}`;
      let command = `aria2c --out="${filename}"`;
      
      // 性能优化选项
      command += ` --max-connection-per-server=16 --split=16 --min-split-size=1M`;
      command += ` --max-tries=${maxRetries} --timeout=${timeout}`;
      command += ` --user-agent="${userAgent}"`;
      command += ` --continue=true --auto-file-renaming=true`;
      
      // 添加密码
      if (password || link.password) {
        const pwd = password || link.password;
        command += ` --header="Cookie: pwd=${pwd}"`;
      }
      
      // 添加自定义头
      if (link.headers) {
        Object.entries(link.headers).forEach(([key, value]) => {
          command += ` --header="${key}: ${value}"`;
        });
      }
      
      command += ` "${link.url}"`;
      commands.push(command);
    });
    
    // 添加并发下载脚本
    if (links.length > 1) {
      const batchCommand = `echo "${commands.map(cmd => cmd.replace(/"/g, '\\"')).join('\n')}" | xargs -P ${concurrent} -I {} bash -c "{}"`;
      commands.push(batchCommand);
    }
    
    return commands;
  }

  // 生成 Aria2 RPC 配置
  generateAria2RPCConfig(links: DirectLink[], config?: Aria2Config): string {
    const rpcUrl = config?.rpcUrl || 'http://localhost:6800/jsonrpc';
    const rpcSecret = config?.rpcSecret || '';
    const defaultOptions = config?.options || {};
    
    const requests = links.map((link, index) => {
      const requestData = {
        id: `pansou_${Date.now()}_${index}`,
        jsonrpc: '2.0',
        method: 'aria2.addUri',
        params: [
          `token:${rpcSecret}`,
          [link.url],
          {
            out: link.filename || `file_${index + 1}`,
            'max-connection-per-server': defaultOptions['max-connection-per-server'] || 16,
            split: defaultOptions.split || 16,
            'min-split-size': defaultOptions['min-split-size'] || '1M',
            'user-agent': defaultOptions['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'referer': defaultOptions.referer || '',
            header: [
              ...(link.password ? [`Cookie: pwd=${link.password}`] : []),
              ...(defaultOptions.header || [])
            ],
            'continue': true,
            'auto-file-renaming': true,
            ...(defaultOptions.out && { out: defaultOptions.out }),
            ...(defaultOptions.dir && { dir: defaultOptions.dir })
          }
        ]
      };
      
      return JSON.stringify(requestData);
    });
    
    return `
#!/bin/bash
# Aria2 RPC 批量下载脚本
RPC_URL="${rpcUrl}"

${requests.map(request => `
curl -X POST "${rpcUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${request}'`).join('\n')}

echo "已添加 ${links.length} 个下载任务到 Aria2"
    `.trim();
  }

  // 生成 qBittorrent Web API 调用
  generateQBTCommands(links: DirectLink[], qbUrl?: string, username?: string, password?: string): string {
    const baseUrl = qbUrl || 'http://localhost:8080';
    const user = username || 'admin';
    const pass = password || 'adminadmin';
    
    const commands = links.map((link, index) => {
      const filename = link.filename || `file_${index + 1}`;
      return `
# 下载任务 ${index + 1}: ${filename}
curl -X POST "${baseUrl}/api/v2/torrents/add" \\
  --cookie-jar cookies.txt \\
  --data "urls=${encodeURIComponent(link.url)}" \\
  --data "savepath=/downloads" \\
  --data "category=pansou" \\
  --data "paused=false"
      `.trim();
    }).join('\n');
    
    return `
#!/bin/bash
# qBittorrent Web API 批量下载脚本

# 登录 qBittorrent
curl -X POST "${baseUrl}/api/v2/auth/login" \\
  --data "username=${user}" \\
  --data "password=${pass}" \\
  --cookie-jar cookies.txt

${commands}

# 清理 cookies
rm -f cookies.txt

echo "已添加 ${links.length} 个下载任务到 qBittorrent"
    `.trim();
  }

  // 生成 Transmission RPC 调用
  generateTransmissionCommands(links: DirectLink[], trUrl?: string, username?: string, password?: string): string {
    const baseUrl = trUrl || 'http://localhost:9091/transmission/rpc';
    
    const commands = links.map((link, index) => {
      const requestData = {
        method: 'torrent-add',
        arguments: {
          filename: link.url,
          'download-dir': '/downloads',
          paused: false
        }
      };
      
      return `
# 添加下载任务 ${index + 1}
curl -X POST "${baseUrl}" \\
  ${username && password ? `-u "${username}:${password}"` : ''} \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(requestData)}'
      `.trim();
    }).join('\n');
    
    return `
#!/bin/bash
# Transmission RPC 批量下载脚本

${commands}

echo "已添加 ${links.length} 个下载任务到 Transmission"
    `.trim();
  }

  // 生成 JDownloader 2 草稿
  generateJDCommands(links: DirectLink[]): string {
    const jdLinks = links.map(link => link.url).join('\n');
    
    return `
#!/bin/bash
# JDownloader 2 批量下载脚本

# 方法1: 通过命令行添加
echo "${jdLinks}" | jdownloader --add-links

# 方法2: 通过 FlashGot 接口 (需要启用)
curl -X POST "http://127.0.0.1:9666/flashgot" \\
  -d "urls=${encodeURIComponent(jdLinks)}"

# 方法3: 创建 .crawljob 文件
CRAWLJOB_DIR="$HOME/.jd2/crawler/jobs"
mkdir -p "$CRAWLJOB_DIR"

${links.map((link, index) => `
cat > "$CRAWLJOB_DIR/pansou_${index + 1}.crawljob" << EOF
text=${link.url}
packageName=pansou_batch_${Date.now()}
downloadFolder=${link.filename || 'downloads'}
autoConfirm=true
enabled=true
EOF
`).join('')}

echo "已添加 ${links.length} 个下载任务到 JDownloader 2"
    `.trim();
  }

  // 生成迅雷下载脚本
  generateXunleiCommands(links: DirectLink[]): string {
    return `
#!/bin/bash
# 迅雷下载脚本 (需要安装迅雷命令行版)

${links.map((link, index) => {
  const filename = link.filename || `file_${index + 1}`;
  return `thunder://download/${Buffer.from(link.url).toString('base64')} --output="${filename}"`;
}).join('\n')}

echo "已开始 ${links.length} 个迅雷下载任务"
    `.trim();
  }

  // 生成 Python 下载脚本
  generatePythonDownloadScript(links: DirectLink[], options?: DownloadOptions): string {
    return `
#!/usr/bin/env python3
# Python 批量下载脚本

import requests
import os
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse
import time

def download_file(url, filename, password=None, headers=None):
    """下载单个文件"""
    try:
        # 准备请求头
        request_headers = {
            'User-Agent': '${options?.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}',
        }
        
        if password:
            request_headers['Cookie'] = f'pwd={password}'
        
        if headers:
            request_headers.update(headers)
        
        # 发送请求
        response = requests.get(url, headers=request_headers, stream=True, timeout=${options?.timeout || 600})
        response.raise_for_status()
        
        # 保存文件
        with open(filename, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        
        print(f"✓ 下载完成: {filename}")
        return True
        
    except Exception as e:
        print(f"✗ 下载失败: {filename} - {str(e)}")
        return False

def main():
    links = ${JSON.stringify(links, null, 2)}
    max_workers = ${options?.concurrent || 5}
    
    # 创建下载目录
    os.makedirs('downloads', exist_ok=True)
    
    # 并发下载
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = []
        
        for i, link in enumerate(links):
            filename = link.get('filename', f'file_{i + 1}')
            filepath = os.path.join('downloads', filename)
            
            future = executor.submit(
                download_file, 
                link['url'], 
                filepath, 
                link.get('password'),
                link.get('headers')
            )
            futures.append(future)
        
        # 等待所有下载完成
        completed = 0
        failed = 0
        
        for future in as_completed(futures):
            if future.result():
                completed += 1
            else:
                failed += 1
        
        print(f"\\n下载完成: 成功 {completed}, 失败 {failed}")

if __name__ == "__main__":
    main()
    `.trim();
  }

  // 生成 IDM 下载列表
  generateIDMList(links: DirectLink[], password?: string): string {
    let list = '';
    
    links.forEach((link, index) => {
      const filename = link.filename || `file_${index + 1}`;
      list += `${link.url}\n`;
      if (password || link.password) {
        list += `Cookie: pwd=${password || link.password}\n`;
      }
      list += `File: ${filename}\n`;
      list += `\n`;
    });
    
    return list;
  }
}

export function getDownloadHelper(): DownloadHelper {
  return new DownloadHelper();
}