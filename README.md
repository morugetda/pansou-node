# PanSou Node.js Version

Node.js版本的PanSou网盘搜索

## 特性

- 高性能搜索 - 支持并发搜索
- 网盘类型分类 - 自动识别多种网盘链接
- 智能排序 - 基于插件等级和时间新鲜度
- 插件系统 - 支持扩展搜索来源
- 二级缓存 - 内存+磁盘缓存
- 认证系统 - 可选的JWT认证

## 支持的网盘类型

百度网盘、阿里云盘、夸克网盘、天翼云盘、UC网盘、移动云盘、115网盘、PikPak、迅雷网盘、123网盘、磁力链接、电驴链接、其他

## 快速开始

### 安装依赖

```bash
npm install
```

### 运行

```bash
npm run dev
8080端口
运行服务器后打开examples文件夹里的浏览器。
```

### 构建

```bash
npm run build
npm start
```

## 配置

支持以下环境变量：

| 环境变量 | 描述 | 默认值 |
|---------|------|-------|
| PORT | 服务端口 | 8080 |
| PROXY | SOCKS5代理 | 无 |
| CHANNELS | 默认搜索的TG频道 | tgsearchers3 |
| ENABLED_PLUGINS | 启用的插件 | 无 |
| AUTH_ENABLED | 启用认证 | false |
| AUTH_USERS | 用户配置 | 无 |
| AUTH_TOKEN_EXPIRY | Token有效期(小时) | 24 |

## API接口

### 搜索

POST /api/search

```json
{
  "kw": "搜索关键词",
  "channels": ["tgsearchers3"],
  "conc": 10,
  "refresh": false,
  "res": "merge",
  "src": "all"
}
```

### 健康检查

GET /api/health

### 认证

POST /api/auth/login
POST /api/auth/verify
POST /api/auth/logout
