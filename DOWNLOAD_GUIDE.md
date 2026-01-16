# 网盘下载工具配置指南

本指南包含各种下载工具的配置和使用方法。

## 1. Aria2c 配置

### 安装
```bash
# Ubuntu/Debian
sudo apt install aria2

# CentOS/RHEL
sudo yum install aria2

# macOS
brew install aria2

# Windows
# 下载: https://aria2.github.io/
```

### 配置文件 (~/.aria2/aria2.conf)
```ini
# 基本设置
continue=true
max-connection-per-server=16
split=16
min-split-size=1M
max-concurrent-downloads=5

# 性能优化
disk-cache=64M
file-allocation=falloc
preallocation=0

# 网络设置
timeout=600
connect-timeout=60
max-tries=5
retry-wait=30

# RPC 设置 (可选)
enable-rpc=true
rpc-listen-all=true
rpc-listen-port=6800
rpc-secret=your-secret-token

# 保存路径
dir=/home/user/Downloads

# 用户代理
user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
```

### 启动 RPC 服务
```bash
aria2c --enable-rpc --rpc-listen-all --rpc-secret=your-secret-token
```

## 2. qBittorrent 配置

### 安装
```bash
# Ubuntu/Debian
sudo apt install qbittorrent

# CentOS/RHEL
sudo yum install qbittorrent

# macOS
brew install qbittorrent

# Windows
# 下载: https://www.qbittorrent.org/
```

### Web UI 配置
1. 启动 qBittorrent
2. 工具 → 选项 → Web UI
3. 勾选 "Web 用户界面"
4. 设置端口 (默认 8080)
5. 设置用户名和密码
6. 勾选 "启用跨站请求伪造(CSRF)保护"

### API 访问
```bash
# 获取登录令牌
curl -X POST "http://localhost:8080/api/v2/auth/login" \
  -d "username=admin&password=adminadmin" \
  --cookie-jar cookies.txt

# 添加下载任务
curl -X POST "http://localhost:8080/api/v2/torrents/add" \
  --cookie cookies.txt \
  -d "urls=https://example.com/file.zip&savepath=/downloads"
```

## 3. Transmission 配置

### 安装
```bash
# Ubuntu/Debian
sudo apt install transmission-daemon

# CentOS/RHEL
sudo yum install transmission-daemon

# macOS
brew install transmission

# Windows
# 下载: https://transmissionbt.com/
```

### RPC 配置 (/etc/transmission-daemon/settings.json)
```json
{
  "rpc-enabled": true,
  "rpc-bind-address": "0.0.0.0",
  "rpc-port": 9091,
  "rpc-username": "admin",
  "rpc-password": "password",
  "rpc-whitelist-enabled": false,
  "download-dir": "/home/user/Downloads"
}
```

### 重启服务
```bash
sudo systemctl restart transmission-daemon
```

## 4. JDownloader 2 配置

### 安装
```bash
# 下载: https://jdownloader.org/jdownloader2

# 启动 FlashGot 接口
# 设置 → 基本设置 → 高级设置 → FlashGot
# 启用: 127.0.0.1:9666
```

### API 访问
```bash
# 添加链接
curl -X POST "http://127.0.0.1:9666/flashgot" \
  -d "urls=https://example.com/file1.zip,https://example.com/file2.zip"

# 创建 .crawljob 文件
mkdir -p ~/.jd2/crawler/jobs
cat > ~/.jd2/crawler/jobs/download.crawljob << EOF
text=https://example.com/file.zip
packageName=my_downloads
downloadFolder=downloads
autoConfirm=true
enabled=true
EOF
```

## 5. 迅雷配置

### 安装
```bash
# Windows
# 下载: https://xl.xunlei.com/

# 命令行版本 (如果有)
thunder --help
```

### 命令行使用
```bash
# 添加下载任务
thunder "https://example.com/file.zip" --output="downloaded_file.zip"

# 批量下载
thunder --batch=links.txt
```

## 6. Python 下载环境

### 安装依赖
```bash
pip install requests tqdm aiohttp aiofiles
```

### 异步下载示例
```python
import aiohttp
import asyncio
import aiofiles
from tqdm import tqdm

async def download_file(session, url, filename):
    async with session.get(url) as response:
        total = int(response.headers.get('content-length', 0))
        
        with open(filename, 'wb') as file:
            with tqdm(total=total, unit='B', unit_scale=True, desc=filename) as pbar:
                async for chunk in response.content.iter_chunked(8192):
                    file.write(chunk)
                    pbar.update(len(chunk))

async def main():
    urls = ["https://example.com/file1.zip", "https://example.com/file2.zip"]
    
    async with aiohttp.ClientSession() as session:
        tasks = [
            download_file(session, url, f"file_{i}.zip")
            for i, url in enumerate(urls)
        ]
        await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())
```

## 7. IDM 配置

### 安装
```bash
# Windows
# 下载: https://www.internetdownloadmanager.com/
```

### 导入下载列表
1. 复制生成的 IDM 列表内容
2. 打开 IDM → 任务 → 批量下载
3. 粘贴链接列表
4. 设置保存路径
5. 开始下载

### 命令行参数
```cmd
# 添加单个任务
IDMan.exe /d "https://example.com/file.zip" /p "C:\Downloads" /f "file.zip" /a

# 批量下载
IDMan.exe /s "links.txt" /p "C:\Downloads"
```

## 8. 浏览器扩展

### 推荐扩展
- **Video DownloadHelper** - 视频下载
- **FlashGot** - 集成下载工具
- **Fatkun Batch Image Downloader** - 批量图片下载
- **DownThemAll** - 批量链接下载

### 使用方法
1. 安装对应扩展
2. 打开网盘分享页面
3. 点击扩展图标
4. 选择下载任务
5. 选择下载工具

## 9. 自动化脚本

### systemd 服务 (Aria2)
```ini
[Unit]
Description=Aria2 Download Manager
After=network.target

[Service]
Type=simple
User=your-user
ExecStart=/usr/bin/aria2c --enable-rpc --rpc-listen-all --rpc-secret=your-secret-token
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Docker Compose
```yaml
version: '3.8'
services:
  aria2:
    image: aria2/aria2
    ports:
      - "6800:6800"
    volumes:
      - ./downloads:/downloads
      - ./aria2.conf:/etc/aria2/aria2.conf
    command: --enable-rpc --rpc-listen-all --rpc-secret=your-secret-token
    
  qbittorrent:
    image: linuxserver/qbittorrent
    ports:
      - "8080:8080"
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Asia/Shanghai
      - WEBUI_PORT=8080
    volumes:
      - ./config/qbittorrent:/config
      - ./downloads:/downloads
```

## 10. 安全注意事项

### 保护下载工具
1. 设置强密码
2. 启用 HTTPS (如果支持)
3. 限制 API 访问 IP
4. 定期更新工具版本

### 避免版权问题
1. 仅下载合法内容
2. 遵守网站使用条款
3. 不要用于商业用途

### 网络安全
1. 使用 VPN 保护隐私
2. 避免使用公共 WiFi 下载
3. 定期检查下载文件安全性

## 11. 故障排除

### 常见问题
1. **下载速度慢** → 检查网络连接，调整并发数
2. **认证失败** → 检查用户名密码，确认服务运行
3. **文件损坏** → 重新下载，检查完整性
4. **权限问题** → 检查文件夹权限，使用绝对路径

### 日志查看
```bash
# Aria2 日志
tail -f ~/.aria2/aria2.log

# Transmission 日志
tail -f /var/lib/transmission/.config/transmission-daemon/log

# qBittorrent 日志
# 查看 Web UI → 工具 → 日志
```

## 12. 性能优化

### 系统优化
```bash
# 增加文件描述符限制
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# 优化网络参数
echo "net.core.rmem_max = 134217728" >> /etc/sysctl.conf
echo "net.core.wmem_max = 134217728" >> /etc/sysctl.conf
sysctl -p
```

### 存储优化
1. 使用 SSD 存储下载文件
2. 设置合适的缓冲区大小
3. 定期清理临时文件
4. 使用 RAID 提高可靠性