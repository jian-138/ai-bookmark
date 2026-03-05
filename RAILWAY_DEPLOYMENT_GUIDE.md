# AI Bookmark Railway 部署指南

## 概述
本项目已配置为基于 GitHub 和 Railway 的自动化生产部署流程。

## 部署架构

### 分支策略
- `main` 分支: 生产环境部署
- `develop` 分支: 预发布/测试环境部署
- 功能分支: 开发环境，不自动部署

### 自动部署流程
1. 代码推送到 GitHub 指定分支
2. GitHub Actions 自动运行测试和构建
3. 测试通过后自动部署到 Railway
4. 部署完成后进行健康检查

## 环境配置

### Railway 环境变量
在 Railway 控制台中设置以下环境变量：

```bash
# 必需变量
SILICONFLOW_API_KEY=your_siliconflow_api_key
JWT_SECRET_KEY=your-production-jwt-secret-key
DATABASE_URL=postgresql://username:password@host:port/database

# 可选变量
REDIS_URL=redis://localhost:6379/0
SENTRY_DSN=your_sentry_dsn
CORS_ORIGINS=https://yourdomain.com
```

### GitHub Secrets
在 GitHub 仓库设置中添加以下 Secrets：

```bash
RAILWAY_TOKEN=your_railway_token
RAILWAY_SERVICE_ID=your_railway_service_id
RAILWAY_STAGING_SERVICE_ID=your_staging_service_id (可选)
```

## 部署步骤

### 1. 初始化 Railway 项目
```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录 Railway
railway login

# 初始化项目
railway init

# 添加环境变量
railway variables set SILICONFLOW_API_KEY=your_key
railway variables set JWT_SECRET_KEY=your_secret
```

### 2. 配置 GitHub 仓库
1. 在 GitHub 创建新仓库
2. 将本地代码推送到 GitHub
3. 在仓库设置中添加 GitHub Secrets
4. 推送代码到 main 分支触发自动部署

### 3. 验证部署
部署完成后，访问以下端点验证：
- 健康检查: `https://your-app.railway.app/health`
- API 测试: `https://your-app.railway.app/api/v1/collections`

## 监控和日志

### Railway 监控
- 访问 Railway 控制台查看应用状态
- 查看实时日志和性能指标
- 设置告警通知

### GitHub Actions 监控
- 在 GitHub 仓库的 Actions 标签页查看部署状态
- 查看详细的构建和部署日志
- 配置失败通知

## 故障排查

### 常见问题

#### 1. 部署失败
- 检查 GitHub Actions 日志
- 验证 Railway 环境变量配置
- 确认数据库连接正常

#### 2. 健康检查失败
- 检查应用是否正常启动
- 验证端口配置是否正确
- 查看应用日志获取错误信息

#### 3. 数据库连接问题
- 确认 DATABASE_URL 格式正确
- 检查数据库访问权限
- 验证网络连接

### 日志查看
```bash
# 查看 Railway 日志
railway logs

# 查看实时日志
railway logs -f
```

## 回滚策略

### 自动回滚
- GitHub Actions 部署失败会自动停止
- Railway 健康检查失败会自动重启服务

### 手动回滚
```bash
# 回滚到上一个版本
railway rollback

# 查看部署历史
railway deployments
```

## 性能优化

### 生产环境配置
- 使用 PostgreSQL 数据库
- 启用 Redis 缓存
- 配置 CDN 加速
- 启用 Gzip 压缩

### 监控指标
- 响应时间 < 200ms
- 错误率 < 1%
- 可用性 > 99.9%

## 安全建议

### 环境变量
- 不要在代码中硬编码敏感信息
- 使用 Railway 的环境变量管理
- 定期轮换 API 密钥

### 网络安全
- 配置 HTTPS
- 限制 CORS 域名
- 启用请求限流
- 设置安全响应头

## 更新和维护

### 定期更新
- 更新依赖包到最新版本
- 更新 Python 运行时版本
- 更新 Railway 配置

### 备份策略
- 定期备份数据库
- 备份重要配置文件
- 测试备份恢复流程

## 支持

如有问题，请查看：
- [Railway 文档](https://docs.railway.app/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- 项目 Issues 页面