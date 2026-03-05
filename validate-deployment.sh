#!/bin/bash

# Railway 部署验证脚本
# 使用方法: ./validate-deployment.sh [deployment_url]

DEPLOYMENT_URL=${1:-$RAILWAY_DEPLOYMENT_URL}

if [ -z "$DEPLOYMENT_URL" ]; then
    echo "❌ 请提供部署 URL 或设置 RAILWAY_DEPLOYMENT_URL 环境变量"
    echo "使用方法: ./validate-deployment.sh https://your-app.railway.app"
    exit 1
fi

echo "🚀 开始验证部署: $DEPLOYMENT_URL"
echo "==================================="

# 1. 基础连接测试
echo "1️⃣ 基础连接测试..."
if curl -f -s "$DEPLOYMENT_URL" > /dev/null; then
    echo "✅ 基础连接正常"
else
    echo "❌ 基础连接失败"
    exit 1
fi

# 2. 健康检查
echo ""
echo "2️⃣ 健康检查..."
HEALTH_RESPONSE=$(curl -s "$DEPLOYMENT_URL/health" 2>/dev/null)
if [ $? -eq 0 ] && echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    echo "✅ 健康检查通过"
    echo "健康状态: $HEALTH_RESPONSE"
else
    echo "❌ 健康检查失败"
    echo "响应: $HEALTH_RESPONSE"
    exit 1
fi

# 3. API 端点测试
echo ""
echo "3️⃣ API 端点测试..."

ENDPOINTS=(
    "/health"
    "/metrics"
    "/api/v1/collections"
    "/docs"
)

for endpoint in "${ENDPOINTS[@]}"; do
    echo "测试: $endpoint"
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL$endpoint")
    
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 422 ]; then
        echo "✅ $endpoint - HTTP $HTTP_CODE"
    else
        echo "❌ $endpoint - HTTP $HTTP_CODE"
    fi
done

# 4. 响应时间测试
echo ""
echo "4️⃣ 响应时间测试..."
START_TIME=$(date +%s%3N)
curl -s "$DEPLOYMENT_URL/health" > /dev/null
END_TIME=$(date +%s%3N)

RESPONSE_TIME=$((END_TIME - START_TIME))
echo "响应时间: ${RESPONSE_TIME}ms"

if [ $RESPONSE_TIME -lt 200 ]; then
    echo "✅ 响应时间优秀"
elif [ $RESPONSE_TIME -lt 500 ]; then
    echo "⚠️ 响应时间一般"
else
    echo "❌ 响应时间较慢"
fi

# 5. 功能测试
echo ""
echo "5️⃣ 功能测试..."

# 测试登录接口
LOGIN_TEST=$(curl -s -X POST "$DEPLOYMENT_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test123"}' \
    -w "%{http_code}" -o /dev/null)

if [ "$LOGIN_TEST" -eq 200 ]; then
    echo "✅ 登录接口正常"
else
    echo "❌ 登录接口异常 (HTTP $LOGIN_TEST)"
fi

# 6. 环境检查
echo ""
echo "6️⃣ 环境检查..."
ENV_INFO=$(curl -s "$DEPLOYMENT_URL/health" | grep -o '"environment":"[^"]*"' | cut -d'"' -f4)
if [ "$ENV_INFO" = "production" ]; then
    echo "✅ 生产环境配置正确"
else
    echo "⚠️ 环境配置: $ENV_INFO"
fi

# 7. 服务依赖检查
echo ""
echo "7️⃣ 服务依赖检查..."
AI_SERVICE_STATUS=$(curl -s "$DEPLOYMENT_URL/health" | grep -o '"ai_service":"[^"]*"' | cut -d'"' -f4)
DB_STATUS=$(curl -s "$DEPLOYMENT_URL/health" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)

echo "AI 服务状态: $AI_SERVICE_STATUS"
echo "数据库状态: $DB_STATUS"

if [ "$AI_SERVICE_STATUS" = "connected" ] && [ "$DB_STATUS" = "connected" ]; then
    echo "✅ 所有服务依赖正常"
else
    echo "⚠️ 部分服务依赖异常"
fi

# 8. SSL 证书检查
echo ""
echo "8️⃣ SSL 证书检查..."
if echo "$DEPLOYMENT_URL" | grep -q "https://"; then
    CERT_INFO=$(echo | openssl s_client -servername $(echo $DEPLOYMENT_URL | sed 's|https://||' | sed 's|/.*||') -connect $(echo $DEPLOYMENT_URL | sed 's|https://||' | sed 's|/.*||'):443 2>/dev/null | openssl x509 -noout -dates)
    if [ $? -eq 0 ]; then
        echo "✅ SSL 证书有效"
        echo "$CERT_INFO" | grep "notAfter" | sed 's|notAfter=||'
    else
        echo "❌ SSL 证书检查失败"
    fi
else
    echo "⚠️ 非 HTTPS 连接，跳过 SSL 检查"
fi

echo ""
echo "==================================="
echo "🎯 部署验证完成！"
echo ""
echo "🔗 应用地址: $DEPLOYMENT_URL"
echo "📚 API 文档: $DEPLOYMENT_URL/docs"
echo "🏥 健康检查: $DEPLOYMENT_URL/health"
echo "📊 监控指标: $DEPLOYMENT_URL/metrics"
echo ""
echo "如果所有测试都通过，说明部署成功！🎉"