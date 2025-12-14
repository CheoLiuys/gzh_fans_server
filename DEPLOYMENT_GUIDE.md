# Vercel部署指南

## 🚀 快速部署步骤

### 第一步：准备Git仓库

如果还没有初始化Git仓库，请执行：

```bash
git init
git add .
git commit -m "Initial commit - 微信公众号粉丝查询API"
```

如果已经有Git仓库，直接提交更改：

```bash
git add .
git commit -m "Update API with latest authentication"
```

### 第二步：推送到代码托管平台

#### 选项A：推送到GitHub
```bash
# 如果还没有添加远程仓库
git remote add origin https://github.com/yourusername/your-repo-name.git

# 推送代码
git push -u origin main
```

#### 选项B：推送到GitLab
```bash
git remote add origin https://gitlab.com/yourusername/your-repo-name.git
git push -u origin main
```

#### 选项C：推送到Bitbucket
```bash
git remote add origin https://bitbucket.org/yourusername/your-repo-name.git
git push -u origin main
```

### 第三步：部署到Vercel

#### 方法1：通过Vercel Dashboard（推荐）

1. **访问Vercel官网**
   - 打开 [https://vercel.com](https://vercel.com)
   - 点击 "Sign Up" 或 "Log In"
   - 使用GitHub、GitLab或Bitbucket账号登录

2. **创建新项目**
   - 登录后点击 "New Project"
   - 选择您的Git仓库
   - 点击 "Import"

3. **配置项目**
   - **Project Name**: 输入项目名称（如：gzh-fans-api）
   - **Framework**: Vercel会自动检测为Python
   - **Root Directory**: 保持默认（根目录）
   - **Build Command**: 保持空白（Vercel自动处理）
   - **Output Directory**: 保持空白

4. **环境变量（可选）**
   - 如果需要设置环境变量，可以在 "Environment Variables" 部分添加
   - 目前项目不需要额外的环境变量

5. **部署**
   - 点击 "Deploy" 按钮
   - 等待部署完成（通常需要1-3分钟）

#### 方法2：使用Vercel CLI

1. **安装Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   vercel
   ```

4. **按照提示操作**
   - 选择团队（个人或团队）
   - 确认项目设置
   - 等待部署完成

### 第四步：验证部署

部署完成后，您会得到一个类似这样的URL：
```
https://your-project-name.vercel.app
```

#### 测试API

1. **健康检查**
   ```bash
   curl https://your-project-name.vercel.app/
   ```

2. **测试API端点**
   ```bash
   curl -X POST https://your-project-name.vercel.app/api/fans-query \
     -H "Content-Type: application/json" \
     -d '{
       "account_name": "刘坏坏",
       "token": "1282161025",
       "cookie": "您的cookie",
       "fingerprint": "524d0cc475f1645c22acfa4b26e407be"
     }'
   ```

## 📋 部署检查清单

### 部署前检查
- [ ] 代码已提交到Git仓库
- [ ] `requirements.txt` 文件存在且格式正确
- [ ] `vercel.json` 配置文件存在
- [ ] `api/index.py` 文件存在且语法正确
- [ ] 本地测试通过

### 部署后验证
- [ ] 访问健康检查端点返回正确响应
- [ ] API端点可以正常调用
- [ ] 返回数据格式正确
- [ ] 错误处理正常工作

## 🔧 常见问题解决

### 1. 部署失败

**问题**: 构建失败或部署错误
**解决方案**:
- 检查 `requirements.txt` 格式是否正确
- 确认 `api/index.py` 语法无误
- 查看Vercel部署日志

### 2. API调用失败

**问题**: 部署后API返回错误
**解决方案**:
- 检查认证信息是否过期
- 确认请求格式正确
- 查看Vercel函数日志

### 3. 冷启动延迟

**问题**: 首次调用响应较慢
**解决方案**:
- 这是正常现象，Vercel有冷启动时间
- 通常1-3秒后会恢复正常

### 4. CORS错误

**问题**: 前端调用时出现CORS错误
**解决方案**:
- API已经配置了CORS支持
- 确认前端请求域名正确

## 🌐 域名配置（可选）

### 使用自定义域名

1. **在Vercel中添加域名**
   - 进入项目设置
   - 点击 "Domains"
   - 添加您的域名

2. **配置DNS**
   - 按照Vercel提示配置DNS记录
   - 等待DNS生效

### 免费域名

Vercel提供免费的 `.vercel.app` 子域名，格式为：
```
https://your-project-name.vercel.app
```

## 📊 监控和维护

### 查看访问日志

1. **Vercel Dashboard**
   - 进入项目页面
   - 点击 "Functions" 标签
   - 查看函数调用日志

2. **使用Vercel CLI**
   ```bash
   vercel logs
   ```

### 更新部署

每次代码更新后：

1. **提交代码**
   ```bash
   git add .
   git commit -m "Update description"
   git push
   ```

2. **自动部署**
   - Vercel会自动检测到推送并重新部署
   - 部署完成后会收到邮件通知

## 🆘 获取帮助

### 官方文档
- [Vercel Python部署指南](https://vercel.com/guides/deploying-a-python-serverless-function-with-vercel)
- [Vercel CLI文档](https://vercel.com/docs/cli)

### 常用命令
```bash
# 查看部署状态
vercel list

# 查看项目信息
vercel inspect

# 查看日志
vercel logs

# 重新部署
vercel --prod
```

---

🎉 **恭喜！您的微信公众号粉丝查询API现在已经可以部署到Vercel免费平台了！**

如果遇到任何问题，请查看Vercel的部署日志或联系技术支持。
