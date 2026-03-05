#!/bin/bash
# Railway环境配置脚本

echo "设置Railway环境变量..."

# 设置基本环境变量
railway variables set ENVIRONMENT=production
railway variables set PORT=8000
railway variables set PYTHONUNBUFFERED=1
railway variables set PYTHONDONTWRITEBYTECODE=1

# 设置数据库URL（使用Railway提供的PostgreSQL）
if [ -z "$DATABASE_URL" ]; then
    echo "请设置DATABASE_URL环境变量"
fi

# 设置API密钥
if [ -z "$SILICONFLOW_API_KEY" ]; then
    echo "请设置SILICONFLOW_API_KEY环境变量"
fi

echo "环境变量设置完成"
echo "当前环境变量:"
railway variables