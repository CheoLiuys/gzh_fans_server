# 微信公众号粉丝查询API

一个用于查询微信公众号粉丝数量的Python API服务，通过模拟微信公众号后台请求来获取公众号的详细信息，包括粉丝数、头像、微信号、签名等。

## 🚀 功能特性

- ✅ **公众号搜索**: 支持通过公众号名称搜索
- ✅ **粉丝数查询**: 获取公众号的粉丝数量
- ✅ **详细信息**: 返回头像、微信号、签名等信息
- ✅ **错误处理**: 完整的错误处理和状态返回
- ✅ **CORS支持**: 支持跨域请求
- ✅ **RESTful设计**: 标准的REST API设计
- ✅ **Vercel部署**: 支持一键部署到Vercel平台

## 📁 项目结构

```
.
├── api/
│   └── index.py              # API主文件
├── requirements.txt          # Python依赖
├── vercel.json              # Vercel配置
├── .gitignore               # Git忽略文件
├── README.md                # 项目说明
├── API_DOCUMENTATION.md     # 详细API文档
├── test_api.py             # API测试脚本
└── debug_test.py           # 调试测试脚本
```

## 🛠️ 技术栈

- **框架**: FastAPI 0.104.1
- **HTTP客户端**: httpx 0.25.2
- **数据验证**: Pydantic 2.5.0
- **ASGI服务器**: Uvicorn 0.24.0
- **部署平台**: Vercel
- **语言**: Python 3.8+

## 🚀 快速开始

### 1. 环境要求

- Python 3.8+
- pip

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 启动服务

```bash
python3 -m uvicorn api.index:app --reload --host 0.0.0.0 --port 8000
```

### 4. 测试API

```bash
# 健康检查
curl http://localhost:8000/

# 测试API（需要有效的认证信息）
python3 test_api.py

# 调试测试
python3 debug_test.py
```

## 📡 API端点

### GET `/`
健康检查端点，返回服务状态。

**响应示例:**
```json
{
  "data": "HelloWord",
  "msg": "success"
}
```

### POST `/api/fans-query`
查询指定公众号的粉丝数量和详细信息。

**请求参数:**
```json
{
  "account_name": "刘坏坏",
  "token": "1376979914",
  "cookie": "完整的cookie字符串",
  "fingerprint": "3fec25255d22fd0f735f8ccec90846da"
}
```

**成功响应:**
```json
{
  "data": {
    "fans_count": 2001,
    "avatar": "http://mmbiz.qpic.cn/mmbiz_png/...",
    "wechat_id": "superliuhuaihuai",
    "signature": "一个贼有意思的副业项目公众号～",
    "nickname": "刘坏坏",
    "fakeid": "Mzg2OTc2NTM1NQ=="
  },
  "msg": "success"
}
```

**错误响应:**
```json
{
  "data": {},
  "msg": "未找到匹配的公众号"
}
```

## 🔧 获取认证信息

### 步骤说明

1. **登录微信公众号后台**: [https://mp.weixin.qq.com](https://mp.weixin.qq.com)
2. **打开开发者工具**: 按F12打开浏览器开发者工具
3. **切换到Network标签页**
4. **进行操作**: 在后台进行任意操作（如查看文章列表）
5. **找到请求**: 在网络请求中找到 `searchbiz` 或 `appmsgpublish` 相关请求
6. **提取信息**: 从请求中提取以下信息：
   - **Cookie**: 请求头中的完整cookie字符串
   - **Token**: URL参数中的token值
   - **Fingerprint**: URL参数中的fingerprint值

### 验证认证信息

使用调试脚本验证认证信息是否有效：

```bash
python3 debug_test.py
```

如果返回 "invalid session"，说明认证信息已过期，需要重新获取。

## 🌐 部署到Vercel

### 1. 准备项目

确保项目包含以下文件：
- `api/index.py` - API主文件
- `requirements.txt` - Python依赖
- `vercel.json` - Vercel配置

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

### 4. 访问API

部署完成后，API地址为：
```
https://your-project-name.vercel.app/api/fans-query
```

## ⚠️ 重要注意事项

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

## 🛡️ 安全建议

1. **不要在前端暴露认证信息**
2. **使用环境变量存储敏感信息**
3. **实现访问频率限制**
4. **记录和监控API调用**
5. **定期更新认证信息**

## 📚 详细文档

更多详细信息请查看：
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - 完整的API文档
- [test_api.py](./test_api.py) - API使用示例
- [debug_test.py](./debug_test.py) - 调试工具

## 🆘 故障排除

### 常见问题

1. **部署失败**: 检查 `requirements.txt` 文件格式
2. **CORS错误**: 确保前端请求域名已添加到CORS配置
3. **冷启动**: 首次访问可能需要1-3秒，这是正常现象
4. **认证失败**: 检查cookie和token是否有效

### 调试技巧

- 查看Vercel部署日志
- 使用 `print()` 语句在函数中输出调试信息
- 本地测试确保代码无误后再部署
- 使用 `debug_test.py` 验证认证信息

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 📄 许可证

MIT License
