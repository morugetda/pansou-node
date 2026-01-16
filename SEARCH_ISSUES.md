# PanSou 搜索问题解决方案

## 🚨 当前问题

搜索"紫薇"等关键词返回0结果，原因是：

### 1. 第三方Telegram搜索API失效
- `tgsou.com` - 服务停止响应
- `tgsearch-api.vercel.app` - 返回404错误
- `api.telemetr.io` - 不是搜索API服务

### 2. 网络连接问题
- 可能需要代理访问Telegram相关服务
- 部分API在中国大陆无法直接访问

## 🔧 解决方案

### 方案1: 使用代理重新启动
```bash
# 如果你有代理，使用以下命令启动
PROXY=socks5://127.0.0.1:1080 npm start

# 或者使用提供的脚本
start-with-proxy.bat
```

### 方案2: 更新搜索API端点
需要修改 `src/service/telegram.ts` 中的API端点：

```typescript
const endpoints = [
  'https://api.summerlost.xyz/api/search',  // 尝试新的API
  'https://tgsearch-prod.vercel.app/api/search',  // 可能的新版本
  'https://your-backup-api.com/api/search'  // 备用API
];
```

### 方案3: 使用本地搜索
如果有其他搜索源，可以：
1. 添加本地搜索插件
2. 使用网盘搜索聚合服务
3. 实现自建搜索系统

### 方案4: 使用现成的搜索服务
可以使用现有的网盘搜索站点作为参考：
- https://so.252035.xyz/
- https://www.alipansou.com/
- https://www.quarkpansou.com/

## 🛠️ 临时解决方案

### 1. 修改配置使用其他搜索源
```json
{
  "CHANNELS": "tgsearchers3,gdtv,shareAliyun",
  "ENABLED_PLUGINS": "demo,pan666"
}
```

### 2. 启用更多插件
修改 `src/config.ts` 中的默认插件列表：
```typescript
ENABLED_PLUGINS: z.string().default('demo,jikepan,pan666,hunhepan,pansearch,panta,qupansou,susu,xuexi,pan789,wanpan,duoji'),
```

### 3. 检查网络连接
```bash
# 测试Telegram连接
curl -I https://api.telegram.org
# 测试代理连接  
curl --proxy socks5://127.0.0.1:1080 https://api.telegram.org
```

## 🎯 推荐操作

### 立即可行的方案：

1. **尝试使用代理启动**
```bash
# 停止当前服务
# 运行 start-with-proxy.bat
```

2. **访问替代搜索站点**
- https://so.252035.xyz/ (官方演示)
- 直接搜索网盘资源

3. **修改搜索配置**
- 减少依赖的搜索频道
- 增加重试机制

## 📝 长期解决方案

### 1. 自建搜索服务
- 部署独立的Telegram搜索API
- 整合多个搜索源
- 建立本地缓存

### 2. 使用官方API
- 申请Telegram Bot API
- 直接搜索公开频道
- 实现实时搜索

### 3. 搜索源聚合
- 整合多个网盘搜索平台
- 提供统一搜索接口
- 优化搜索结果质量

## 🔍 测试方法

### 1. 测试API连接
```bash
curl -X POST "http://localhost:8892/api/search" \
  -H "Content-Type: application/json" \
  -d '{"kw":"test","src":"plugin","refresh":true}'
```

### 2. 检查服务日志
查看后端控制台输出的详细错误信息

### 3. 验证网络连接
确保可以访问外部搜索API

## 💡 建议

1. **优先使用代理** - 大部分Telegram相关服务需要代理访问
2. **关注更新** - 等待作者更新搜索API端点
3. **考虑替代方案** - 使用其他成熟的网盘搜索服务

## 📞 联系支持

如果以上方案都无法解决问题，可以：
- 查看项目GitHub Issues
- 联系原作者获取更新
- 参与社区讨论寻找解决方案