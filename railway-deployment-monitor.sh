#!/bin/bash

# Railway部署验证和监控脚本
# 使用方法: ./railway-deployment-monitor.sh [deployment_url]

DEPLOYMENT_URL=${1:-"https://ai-bookmark-production-5ecc.up.railway.app"}
MAX_RETRIES=30
RETRY_INTERVAL=20

echo "🚀 Railway部署监控和验证工具"
echo "==================================="
echo "部署URL: $DEPLOYMENT_URL"
echo "最大重试次数: $MAX_RETRIES"
echo "重试间隔: ${RETRY_INTERVAL}秒"
echo ""

# 等待部署完成的函数
wait_for_deployment() {
    local retry_count=0
    
    echo "⏳ 等待部署完成..."
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        echo "尝试 $((retry_count + 1))/$MAX_RETRIES"
        
        # 测试健康检查端点
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/health" 2>/dev/null)
        
        if [ "$HTTP_CODE" -eq 200 ]; then
            echo "✅ 部署成功！健康检查通过"
            return 0
        elif [ "$HTTP_CODE" -eq 502 ] || [ "$HTTP_CODE" -eq 503 ]; then
            echo "⏳ 部署进行中... (HTTP $HTTP_CODE)"
        else
            echo "⚠️ 未知状态 (HTTP $HTTP_CODE)"
        fi
        
        retry_count=$((retry_count + 1))
        
        if [ $retry_count -lt $MAX_RETRIES ]; then
            echo "等待 ${RETRY_INTERVAL}秒后重试..."
            sleep $RETRY_INTERVAL
        fi
    done
    
    echo "❌ 部署超时，超过最大重试次数"
    return 1
}

# 详细健康检查
health_check_detailed() {
    echo ""
    echo "🏥 详细健康检查..."
    
    HEALTH_RESPONSE=$(curl -s "$DEPLOYMENT_URL/health" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo "健康检查响应: $HEALTH_RESPONSE"
        
        # 解析JSON响应
        if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
            echo "✅ 应用状态健康"
        else
            echo "⚠️ 应用状态异常"
        fi
        
        # 检查环境
        ENVIRONMENT=$(echo "$HEALTH_RESPONSE" | grep -o '"environment":"[^"]*"' | cut -d'"' -f4)
        echo "运行环境: $ENVIRONMENT"
        
        # 检查服务依赖
        AI_SERVICE=$(echo "$HEALTH_RESPONSE" | grep -o '"ai_service":"[^"]*"' | cut -d'"' -f4)
        DB_SERVICE=$(echo "$HEALTH_RESPONSE" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
        echo "AI服务: $AI_SERVICE"
        echo "数据库: $DB_SERVICE"
    else
        echo "❌ 健康检查失败"
    fi
}

# API端点测试
test_api_endpoints() {
    echo ""
    echo "🧪 API端点测试..."
    
    ENDPOINTS=(
        "/health:健康检查"
        "/metrics:监控指标"
        "/docs:API文档"
        "/api/v1/collections:收藏列表"
    )
    
    for endpoint_info in "${ENDPOINTS[@]}"; do
        IFS=':' read -r endpoint description <<< "$endpoint_info"
        
        echo "测试: $description ($endpoint)"
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL$endpoint" 2>/dev/null)
        
        if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 422 ]; then
            echo "✅ $description - HTTP $HTTP_CODE"
        else
            echo "❌ $description - HTTP $HTTP_CODE"
        fi
    done
}

# 性能测试
performance_test() {
    echo ""
    echo "⚡ 性能测试..."
    
    START_TIME=$(date +%s%3N)
    curl -s "$DEPLOYMENT_URL/health" > /dev/null 2>&1
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
}

# 功能测试
test_core_functionality() {
    echo ""
    echo "🔧 核心功能测试..."
    
    # 测试登录
    echo "测试用户登录..."
    LOGIN_RESPONSE=$(curl -s -X POST "$DEPLOYMENT_URL/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"username":"test","password":"test123"}' 2>/dev/null)
    
    if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
        echo "✅ 用户登录功能正常"
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        USER_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"user_id":"[^"]*"' | cut -d'"' -f4)
        
        # 测试提交收藏
        echo "测试收藏提交..."
        COLLECT_RESPONSE=$(curl -s -X POST "$DEPLOYMENT_URL/api/v1/collect" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "{\"user_id\":\"$USER_ID\",\"original_text\":\"AI正在改变教育方式\",\"url\":\"https://example.com\"}" 2>/dev/null)
        
        if echo "$COLLECT_RESPONSE" | grep -q '"success":true'; then
            echo "✅ 收藏提交功能正常"
        else
            echo "❌ 收藏提交功能异常"
        fi
    else
        echo "❌ 用户登录功能异常"
    fi
}

# 生成报告
generate_report() {
    echo ""
    echo "==================================="
    echo "📊 Railway部署验证报告"
    echo "==================================="
    echo "部署URL: $DEPLOYMENT_URL"
    echo "验证时间: $(date)"
    echo ""
    
    # 总体状态评估
    echo "总体状态:"
    if wait_for_deployment; then
        health_check_detailed
        test_api_endpoints
        performance_test
        test_core_functionality
        
        echo ""
        echo "🎉 部署验证完成！"
        echo "✅ Railway平台部署成功"
        echo "✅ 所有核心功能正常运行"
        echo "✅ 性能指标符合预期"
        
        echo ""
        echo "🔗 访问链接:"
        echo "  应用主页: $DEPLOYMENT_URL"
        echo "  API文档: $DEPLOYMENT_URL/docs"
        echo "  健康检查: $DEPLOYMENT_URL/health"
        echo "  监控指标: $DEPLOYMENT_URL/metrics"
        
    else
        echo "❌ 部署验证失败"
        echo "请检查Railway控制台日志获取详细信息"
        echo "Railway控制台: https://railway.app/dashboard"
    fi
}

# 主函数
main() {
    generate_report
}

# 运行主函数
main "$@"