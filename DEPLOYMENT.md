# Vercel 部署指南

## 项目已准备就绪

您的微信公众号粉丝查询 API 项目已经配置完成，可以部署到 Vercel。

## 部署步骤

### 方法一：通过 Vercel CLI 部署

1. 安装 Vercel CLI：
```bash
npm i -g vercel
```

2. 登录 Vercel：
```bash
vercel login
```

3. 在项目根目录运行：
```bash
vercel
```

4. 按照提示完成部署配置

### 方法二：通过 Vercel 网站部署

1. 访问 [vercel.com](https://vercel.com)
2. 登录您的账户
3. 点击 "New Project"
4. 导入您的 GitHub 仓库：`https://github.com/CheoLiuys/gzh_fans_server.git`
5. Vercel 会自动检测到 Python 项目并使用以下配置：
   - **Framework Preset**: Python
   - **Root Directory**: ./
   - **Build Command**: (空)
   - **Output Directory**: (空)
   - **Install Command**: `pip install -r requirements.txt`

6. 点击 "Deploy"

## 项目结构

```
gzh_fans/
├── api/
│   └── index.py          # Flask API 应用
├── requirements.txt       # Python 依赖
├── vercel.json           # Vercel 配置文件
├── README.md             # 项目说明
└── DEPLOYMENT.md         # 部署指南
```

## API 端点

部署后，您的 API 将在以下地址可用：

- **健康检查**: `https://your-app.vercel.app/`
- **粉丝查询**: `https://your-app.vercel.app/api/fans-query` (POST)

## 环境变量（可选）

如果需要配置环境变量，可以在 Vercel 控制台中添加：

1. 进入项目设置
2. 点击 "Environment Variables"
3. 添加所需的环境变量

## 测试部署

部署完成后，您可以使用以下命令测试：

```bash
# 健康检查
curl https://your-app.vercel.app/

# 粉丝查询
curl -X POST https://your-app.vercel.app/api/fans-query \
  -H "Content-Type: application/json" \
  -d '{
    "account_name": "您的公众号名称",
    "token": "您的微信token",
    "cookie": "您的微信cookie",
    "fingerprint": "您的指纹"
  }'
```

## 注意事项

1. 确保您的微信 token、cookie 和 fingerprint 是有效的
2. Vercel 免费版有函数执行时间限制（10秒）
3. 如果遇到超时问题，可以考虑优化 API 响应时间
4. 建议定期更新微信认证信息以保持 API 可用性

## 故障排除

如果部署失败，请检查：

1. `requirements.txt` 文件是否正确
2. `vercel.json` 配置是否正确
3. API 代码是否有语法错误
4. 依赖包版本是否兼容

更多帮助请参考 [Vercel Python 文档](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/python)。
