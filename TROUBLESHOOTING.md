# Vercel部署故障排除指南

## 🚨 FUNCTION_INVOCATION_FAILED 错误解决方案

### 问题分析
`FUNCTION_INVOCATION_FAILED` 是Vercel部署中常见的错误，通常由以下原因引起：

1. **配置文件问题**
2. **依赖包问题**
3. **代码结构问题**
4. **运行时兼容性问题**

### ✅ 已修复的问题

#### 1. 简化vercel.json配置
```json
{
  "version": 2
}
```
- 移除了复杂的builds和routes配置
- 让Vercel自动检测Python项目

#### 2. 添加api/__init__.py
- 确保api目录被正确识别为Python包
- 支持Vercel的Python函数检测

#### 3. 优化API结构
- 确保handler变量正确导出
- 使用标准的FastAPI结构

### 🔧 部署步骤

#### 第一步：推送最新代码
```bash
git push origin main
```

#### 第二步：重新部署
1. **在Vercel Dashboard中**：
   - 进入您的项目页面
   - 点击 "Redeploy" 按钮
   - 或者点击 "Git" 分支旁边的 "Redeploy"

2. **或者使用Vercel CLI**：
   ```bash
   vercel --prod
   ```

#### 第三步：检查部署日志
1. 访问Vercel项目页面
2. 点击 "Functions" 标签
3. 查看详细的错误日志

### 🧪 测试部署

#### 1. 健康检查
```bash
curl https://您的项目名.vercel.app/
```
应该返回：
```json
{"data": "HelloWord", "msg": "success"}
```

#### 2. API端点测试
```bash
curl -X POST https://您的项目名.vercel.app/api/fans-query \
  -H "Content-Type: application/json" \
  -d '{
    "account_name": "测试",
    "token": "test",
    "cookie": "test",
    "fingerprint": "test"
  }'
```

### 📋 常见问题检查清单

#### ✅ 部署前检查
- [ ] `vercel.json` 只包含 `{"version": 2}`
- [ ] `api/__init__.py` 文件存在
- [ ] `api/index.py` 文件末尾有 `handler = app`
- [ ] `requirements.txt` 格式正确
- [ ] 所有依赖包版本固定

#### ✅ 部署后检查
- [ ] 健康检查端点正常响应
- [ ] Functions页面没有错误日志
- [ ] 可以访问API端点
- [ ] 返回正确的JSON格式

### 🔄 如果仍然失败

#### 方案1：使用最小化测试
创建一个简单的测试文件 `api/test.py`：
```python
def handler(request):
    return {"data": "test", "msg": "success"}
```

#### 方案2：检查依赖包
确保 `requirements.txt` 中的包都支持Vercel：
```txt
fastapi==0.104.1
uvicorn==0.24.0
httpx==0.25.2
pydantic==2.5.0
```

#### 方案3：查看详细日志
```bash
vercel logs
```

#### 方案4：重新创建项目
1. 在Vercel中删除项目
2. 重新导入Git仓库
3. 使用默认配置部署

### 🆘 获取帮助

#### Vercel官方文档
- [Python Functions](https://vercel.com/docs/concepts/functions/serverless-functions)
- [Troubleshooting](https://vercel.com/docs/concepts/functions/troubleshooting)

#### 社区支持
- [Vercel Discord](https://vercel.com/discord)
- [GitHub Issues](https://github.com/vercel/vercel/issues)

### 📞 联系支持

如果以上方法都无法解决问题：

1. **收集信息**：
   - 项目URL
   - 错误日志
   - 部署ID

2. **联系Vercel支持**：
   - 在项目页面点击 "Help"
   - 提交支持请求

---

## 🎯 快速修复命令

如果您想快速重试部署：

```bash
# 1. 确保代码最新
git add .
git commit -m "Fix deployment issues"
git push

# 2. 重新部署
vercel --prod

# 3. 查看日志
vercel logs
```

**记住**：Vercel的免费套餐有冷启动时间，首次请求可能需要1-3秒。
