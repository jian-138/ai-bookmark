#!/bin/bash

# Railway 部署环境变量配置脚本
# 使用方法: ./setup-railway-env.sh

echo "🚀 设置 Railway 环境变量..."

# 检查 Railway CLI 是否安装
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI 未安装，请先安装: npm install -g @railway/cli"
    exit 1
fi

# 检查是否已登录
if ! railway whoami &> /dev/null; then
    echo "❌ 请先登录 Railway: railway login"
    exit 1
fi

# 必需的环境变量
read -p "请输入 SiliconFlow API Key: " SILICONFLOW_API_KEY
read -p "请输入 JWT Secret Key (最少32字符): " JWT_SECRET_KEY
read -p "请输入数据库连接字符串 (PostgreSQL): " DATABASE_URL

# 可选的环境变量
echo ""
echo "可选配置 (直接回车跳过):"
read -p "Redis 连接字符串 (可选): " REDIS_URL
read -p "Sentry DSN (可选): " SENTRY_DSN
read -p "CORS 允许的域名 (逗号分隔): " CORS_ORIGINS

# 设置环境变量
echo ""
echo "正在设置环境变量..."

railway variables set SILICONFLOW_API_KEY="$SILICONFLOW_API_KEY"
railway variables set JWT_SECRET_KEY="$JWT_SECRET_KEY"
railway variables set DATABASE_URL="$DATABASE_URL"
railway variables set ENVIRONMENT=production
railway variables set LOG_LEVEL=INFO
railway variables set LOG_FORMAT=json
railway variables set DEBUG=false
railway variables set HEALTH_CHECK_ENABLED=true

# 设置可选变量
if [ -n "$REDIS_URL" ]; then
    railway variables set REDIS_URL="$REDIS_URL"
fi

if [ -n "$SENTRY_DSN" ]; then
    railway variables set SENTRY_DSN="$SENTRY_DSN"
fi

if [ -n "$CORS_ORIGINS" ]; then
    railway variables set CORS_ORIGINS="$CORS_ORIGINS"
else
    railway variables set CORS_ORIGINS="*"
fi

# 设置性能参数
echo ""
echo "设置性能参数..."
railway variables set WORKERS=4
railway variables set TIMEOUT=60
railway variables set KEEP_ALIVE=30
railway variables set PORT=8000

echo ""
echo "✅ 环境变量设置完成！"
echo ""
echo "当前环境变量:"
railway variables
echo ""
echo "下一步:"
echo "1. 提交代码到 GitHub"
echo "2. 推送到 main 分支触发自动部署"
echo "3. 访问 Railway 控制台查看部署状态"
