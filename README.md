# 微信公众号粉丝查询API

基于Flask的微信公众号粉丝数查询服务，部署在Vercel上。

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

## 部署

项目已配置为在Vercel上自动部署。

## 依赖

- Flask==2.3.3
- requests==2.31.0
