# 微信公众号粉丝查询API文档

## 📋 概述

这是一个用于查询微信公众号粉丝数量的API服务，通过模拟微信公众号后台的请求来获取公众号的详细信息，包括粉丝数、头像、微信号、签名等。

## 🚀 功能特性

- ✅ 支持公众号搜索
- ✅ 获取粉丝数量
- ✅ 获取公众号基本信息
- ✅ 完整的错误处理
- ✅ 支持CORS跨域
- ✅ RESTful API设计

## 📡 API端点

### POST `/api/fans-query`

查询指定公众号的粉丝数量和详细信息。

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| account_name | string | 是 | 要查询的公众号名称 |
| token | string | 是 | 微信公众号后台token |
| cookie | string | 是 | 登录微信公众号后台的cookie |
| fingerprint | string | 是 | 浏览器指纹 |

#### 请求示例

```json
{
  "account_name": "刘坏坏",
  "token": "1376979914",
  "cookie": "appmsglist_action_3908677324=card; ua_id=ee1ejnK0PjhugA8rAAAAAGWRrFaWtmmwECTVlCBAx70=; wxuin=58724258977014; mm_lang=zh_CN; ...",
  "fingerprint": "3fec25255d22fd0f735f8ccec90846da"
}
```

#### 响应格式

##### 成功响应
```json
{
  "data": {
    "fans_count": 2001,
    "avatar": "http://mmbiz.qpic.cn/mmbiz_png/eBcr3qxk5cvZBgRQ0SibVDDfD8RLENzTiaIhoB6TgjnMgwdgBSbjK93BqfCfVPb1BHq3Qiaib6d4rAte55F8JSc5Wg/0?wx_fmt=png",
    "wechat_id": "superliuhuaihuai",
    "signature": "一个贼有意思的副业项目公众号～",
    "nickname": "刘坏坏",
    "fakeid": "Mzg2OTc2NTM1NQ=="
  },
  "msg": "success"
}
```

##### 错误响应
```json
{
  "data": {},
  "msg": "未找到匹配的公众号"
}
```

```json
{
  "data": {},
  "msg": "查询失败: invalid session"
}
```

#### 响应字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| fans_count | number | 粉丝数量（必须） |
| avatar | string | 公众号头像URL |
| wechat_id | string | 微信号（公众号ID） |
| signature | string | 公众号签名 |
| nickname | string | 公众号昵称 |
| fakeid | string | 公众号内部ID |

## 🔧 获取认证信息

### 1. 获取Token和Cookie

1. 登录 [微信公众号后台](https://mp.weixin.qq.com)
2. 打开浏览器开发者工具 (F12)
3. 切换到 Network 标签页
4. 在公众号后台进行任意操作（如查看文章列表）
5. 在网络请求中找到 `searchbiz` 或 `appmsgpublish` 相关请求
6. 从请求头中提取以下信息：

   - **Cookie**: 完整的cookie字符串
   - **Token**: URL参数中的token值
   - **Fingerprint**: URL参数中的fingerprint值

### 2. 验证认证信息有效性

使用提供的测试脚本验证认证信息是否有效：

```bash
python3 debug_test.py
```

如果返回 "invalid session"，说明认证信息已过期，需要重新获取。

## 🛠️ 本地开发

### 环境要求

- Python 3.8+
- pip

### 安装依赖

```bash
pip install -r requirements.txt
```

### 启动服务

```bash
python3 -m uvicorn api.index:app --reload --host 0.0.0.0 --port 8000
```

### 测试API

```bash
python3 test_api.py
```

## 🌐 部署到Vercel

### 1. 准备部署

确保项目结构如下：

```
your-project/
├── api/
│   └── index.py          # API主文件
├── requirements.txt      # Python依赖
├── vercel.json          # Vercel配置
├── .gitignore           # Git忽略文件
└── README.md            # 项目说明
```

### 2. 推送到Git

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 3. 部署到Vercel

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 导入您的Git仓库
4. Vercel会自动检测Python项目并配置
5. 点击 "Deploy"

### 4. 访问部署的API

部署完成后，API地址为：
```
https://your-project-name.vercel.app/api/fans-query
```

## ⚠️ 注意事项

### 1. 认证信息时效性

- **Cookie和Token有时效性**，通常几小时到几天不等
- **过期后需要重新获取**，建议定期更新
- **不要在代码中硬编码认证信息**

### 2. 使用限制

- **请勿频繁请求**，避免触发微信的反爬虫机制
- **建议设置合理的请求间隔**（如每秒最多1次）
- **遵守微信的使用条款**

### 3. 错误处理

常见错误及解决方案：

| 错误信息 | 原因 | 解决方案 |
|----------|------|----------|
| invalid session | 认证信息过期 | 重新获取cookie和token |
| 未找到匹配的公众号 | 公众号不存在或名称错误 | 检查公众号名称是否正确 |
| 请求超时 | 网络问题或微信服务器响应慢 | 增加超时时间或重试 |

## 🔍 调试工具

### 1. 健康检查

```bash
curl http://localhost:8000/
```

### 2. API测试

```bash
curl -X POST http://localhost:8000/api/fans-query \
  -H "Content-Type: application/json" \
  -d '{
    "account_name": "测试公众号",
    "token": "your_token",
    "cookie": "your_cookie",
    "fingerprint": "your_fingerprint"
  }'
```

### 3. 调试脚本

```bash
python3 debug_test.py
```

## 📊 性能优化

### 1. 缓存策略

- 可以对查询结果进行缓存，避免重复请求
- 建议缓存时间：5-10分钟

### 2. 并发控制

- 使用异步请求提高性能
- 限制并发数量避免被封

### 3. 错误重试

- 实现指数退避重试机制
- 设置最大重试次数

## 🛡️ 安全建议

1. **不要在前端暴露认证信息**
2. **使用环境变量存储敏感信息**
3. **实现访问频率限制**
4. **记录和监控API调用**
5. **定期更新认证信息**

## 📞 技术支持

如果遇到问题，请检查：

1. 认证信息是否有效
2. 网络连接是否正常
3. 公众号名称是否正确
4. 是否触发了反爬虫机制

## 📄 许可证

MIT License
