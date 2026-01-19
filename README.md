# 微信公众号粉丝查询API

基于Node.js Express的微信公众号粉丝数查询服务，部署在Vercel上。

## 🆕 新功能

### 数据缓存机制
- **公众号信息缓存**：缓存 24 小时，减少重复查询
- **粉丝数缓存**：缓存 2 小时，提高响应速度
- **自动降级**：未配置 Redis 时自动降级为无缓存模式

### Cookie 智能管理
- **自动收集**：自动收集所有请求中的 cookie，形成公共 Cookie 池
- **多重备份**：保留最新版本 + 5 个历史版本（共 6 个）
- **自动验证**：每次请求时自动验证 cookie 有效性（搜索"刘坏坏"）
- **智能选择**：优先使用时间最早的有效 cookie
- **失效通知**：仅剩 1 个有效 cookie 时通过 Bark 通知（每天最多 2 次）

### 新增 API 端点
- `GET /api/cookie-status` - 查看 Cookie 池状态
- `POST /api/clean-cookies` - 清理无效 Cookie

---

## API端点

### 健康检查
```
GET /
```

### 查询粉丝数
```
POST /api/fans-query
```

#### 请求参数
```json
{
  "account_name": "公众号名称",
  "token": "微信token",
  "cookie": "微信cookie",
  "fingerprint": "指纹"
}
```

#### 响应格式
```json
{
  "data": {
    "fans_count": 粉丝数,
    "avatar": "头像URL",
    "wechat_id": "微信号",
    "signature": "签名",
    "nickname": "昵称",
    "fakeid": "fakeid"
  },
  "msg": "success"
}
```

### Cookie 池状态查询
```
GET /api/cookie-status
```

#### 响应格式
```json
{
  "data": {
    "total": 6,
    "valid": 4,
    "invalid": 1,
    "unknown": 1
  },
  "msg": "success"
}
```

### Cookie 详细信息查询
```
GET /api/cookie-details
```

#### 响应格式
```json
{
  "data": {
    "cookies": [
      {
        "index": 0,
        "status": "有效",
        "created_at": "2025-01-19T09:00:00.000Z",
        "created_at_formatted": "2025/1/19 17:00:00",
        "last_checked": "2025-01-19T09:30:00.000Z",
        "last_checked_formatted": "2025/1/19 17:30:00",
        "cookie_preview": {
          "data_ticket": "xxx",
          "slave_user": "gh_xxx",
          "bizuin": "123456"
        },
        "cookie_length": 1234,
        "cookie_hash": "abc123def456"
      }
    ],
    "total": 6
  },
  "msg": "success"
}
```

#### 字段说明
- `index`: cookie 在池中的索引（0 为最新）
- `status`: 验证状态（有效/无效/未知）
- `created_at`: 创建时间（ISO 8601 格式）
- `created_at_formatted`: 创建时间（本地格式）
- `last_checked`: 最后验证时间（ISO 8601 格式）
- `last_checked_formatted`: 最后验证时间（本地格式）
- `cookie_preview`: cookie 中的关键信息
- `cookie_length`: cookie 字符串长度
- `cookie_hash`: cookie 的哈希值（唯一标识）

### 清理无效 Cookie
```
POST /api/clean-cookies
```

#### 响应格式
```json
{
  "data": {
    "cleaned": 1
  },
  "msg": "success"
}
```

## 环境变量配置

创建 `.env` 文件（参考 `.env.example`）：

```bash
# Upstash Redis 配置（必需，用于缓存和 Cookie 管理）
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Bark 通知 Token（可选，用于 Cookie 失效通知）
# 不配置则使用默认 Token
BARK_TOKEN=your-bark-token

# 服务器端口（本地开发使用）
PORT=5000
```

### 获取 Upstash Redis

1. 访问 [Upstash Console](https://console.upstash.com/)
2. 注册/登录账号
3. 创建数据库
4. 获取 `REST URL` 和 `REST Token`
5. 配置到环境变量中

### 配置 Bark 通知

1. 在 iOS 设备上安装 Bark 应用
2. 获取你的 Bark Token（在应用设置中）
3. 配置到 `BARK_TOKEN` 环境变量（可选）

## 部署

项目已配置为在Vercel上自动部署。详细部署说明请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)。

### Vercel 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `BARK_TOKEN` (可选)

## 技术栈

- **Node.js** - 运行时环境
- **Express** - Web 框架
- **Axios** - HTTP 客户端
- **CORS** - 跨域支持
- **@upstash/redis** - Redis 客户端（缓存和 Cookie 管理）

## 依赖

- express@^4.18.2
- axios@^1.6.0
- cors@^2.8.5
- @upstash/redis@latest
