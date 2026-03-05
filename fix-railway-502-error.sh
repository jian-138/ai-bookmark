#!/bin/bash
# Railway 502错误自动修复脚本

echo "🚀 Railway 502错误自动修复脚本"
echo "======================================"

RAILWAY_URL="https://ai-bookmark-production-5ecc.up.railway.app"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        return 1
    fi
}

# 1. 检查当前服务状态
echo "📊 1. 检查服务状态..."

# 测试健康检查端点
echo "测试健康检查端点..."
if command -v curl >/dev/null 2>&1; then
    response=$(curl -s -w "%{http_code}" -o /dev/null "$RAILWAY_URL/health" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ 服务正常运行 (HTTP 200)${NC}"
        echo "服务已恢复，无需修复！"
        exit 0
    elif [ "$response" = "502" ]; then
        echo -e "${YELLOW}⚠️  检测到502错误${NC}"
        echo "开始修复流程..."
    else
        echo -e "${RED}❌ 服务异常 (HTTP $response)${NC}"
        echo "开始修复流程..."
    fi
else
    echo -e "${YELLOW}⚠️  curl命令不可用，跳过网络测试${NC}"
fi

echo ""

# 2. 检查Railway CLI
echo "🔧 2. 检查Railway CLI..."
if command -v railway >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Railway CLI已安装${NC}"
else
    echo -e "${RED}❌ Railway CLI未安装${NC}"
    echo "请安装Railway CLI:"
    echo "npm install -g @railway/cli"
    exit 1
fi

echo ""

# 3. 检查项目链接
echo "🔗 3. 检查项目链接..."
if railway status >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 项目已链接${NC}"
else
    echo -e "${YELLOW}⚠️  项目未链接，尝试初始化...${NC}"
    railway init
    check_success "项目初始化"
fi

echo ""

# 4. 查看应用日志
echo "📋 4. 查看应用日志（最近50行）..."
echo "最近的应用日志："
railway logs -n 50 | tail -20
echo ""

# 5. 尝试重启应用
echo "🔄 5. 尝试重启应用..."
echo "正在重启Railway应用..."
railway restart
check_success "应用重启"

echo ""

# 6. 等待服务恢复
echo "⏳ 6. 等待服务恢复..."
echo "等待30秒让服务完全启动..."
sleep 30

echo ""

# 7. 验证修复结果
echo "✅ 7. 验证修复结果..."
echo "测试服务是否恢复正常..."

max_attempts=5
attempt=1
while [ $attempt -le $max_attempts ]; do
    echo "尝试 $attempt/$max_attempts..."
    
    if command -v curl >/dev/null 2>&1; then
        response=$(curl -s -w "%{http_code}" -o /dev/null "$RAILWAY_URL/health" 2>/dev/null || echo "000")
        
        if [ "$response" = "200" ]; then
            echo -e "${GREEN}🎉 修复成功！服务已恢复正常${NC}"
            
            # 测试登录功能
            echo ""
            echo "🔐 测试登录功能..."
            login_test=$(curl -s -X POST "$RAILWAY_URL/api/v1/auth/login" \
                -H "Content-Type: application/json" \
                -d '{"username":"test","password":"test123"}' 2>/dev/null)
            
            if echo "$login_test" | grep -q "token"; then
                echo -e "${GREEN}✅ 登录功能正常${NC}"
            else
                echo -e "${YELLOW}⚠️  登录功能可能有问题${NC}"
                echo "登录测试结果: $login_test"
            fi
            
            exit 0
        else
            echo -e "${YELLOW}⚠️  服务仍未恢复 (HTTP $response)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  curl命令不可用，无法验证${NC}"
        exit 0
    fi
    
    if [ $attempt -lt $max_attempts ]; then
        echo "等待10秒后重试..."
        sleep 10
    fi
    
    attempt=$((attempt + 1))
done

echo ""
echo -e "${RED}❌ 修复失败，服务仍未恢复正常${NC}"
echo ""
echo "建议采取以下措施："
echo "1. 检查Railway控制台中的详细日志"
echo "2. 检查环境变量配置"
echo "3. 检查数据库连接"
echo "4. 尝试重新部署应用"
echo "5. 联系Railway支持团队"
echo ""
echo "访问Railway控制台: https://railway.app/dashboard"
echo "查看详细日志: railway logs -f"

exit 1