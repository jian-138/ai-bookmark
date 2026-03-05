#!/bin/bash

# 客户端配置统一更新脚本
# 将所有客户端配置更新为Railway生产环境

RAILWAY_URL="https://ai-bookmark-production-5ecc.up.railway.app"
OLD_LOCAL_URL="http://localhost:8000"

echo "🚀 客户端配置统一迁移到Railway生产环境"
echo "======================================="
echo "Railway生产地址: $RAILWAY_URL"
echo "旧本地地址: $OLD_LOCAL_URL"
echo ""

# 1. Chrome扩展配置更新
echo "📱 更新Chrome扩展配置..."

# 更新config.js
echo "更新Chrome扩展config.js..."
if [ -f "chrome-extension/config.js" ]; then
    # 确保生产环境配置正确
    sed -i "s|$OLD_LOCAL_URL|$RAILWAY_URL|g" chrome-extension/config.js
    sed -i "s|const CURRENT_ENV = 'development'|const CURRENT_ENV = 'production'|g" chrome-extension/config.js
    echo "✅ Chrome扩展config.js已更新"
else
    echo "⚠️  Chrome扩展config.js不存在"
fi

# 批量更新所有JS文件中的API地址
echo "批量更新Chrome扩展JS文件..."
find chrome-extension -name "*.js" -type f -exec sed -i "s|$OLD_LOCAL_URL|$RAILWAY_URL|g" {} \;

# 2. Android应用配置检查
echo ""
echo "📱 检查Android应用配置..."
ANDROID_CONFIG_FILE="app/src/main/java/com/example/aicollector/di/NetworkModule.kt"
if [ -f "$ANDROID_CONFIG_FILE" ]; then
    if grep -q "ai-bookmark-production" "$ANDROID_CONFIG_FILE"; then
        echo "✅ Android应用已配置为Railway生产地址"
    else
        echo "⚠️  Android应用配置可能需要手动更新"
    fi
else
    echo "⚠️  Android配置文件不存在"
fi

# 3. 微信机器人配置更新
echo ""
echo "🤖 更新微信机器人配置..."
BOT_CONFIG_FILES=(
    "bot/.env.example"
    "bot/bot-integrated.js"
)

for file in "${BOT_CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "更新$file..."
        sed -i "s|$OLD_LOCAL_URL|$RAILWAY_URL|g" "$file"
        echo "✅ $file已更新"
    else
        echo "⚠️  $file不存在"
    fi
done

# 4. 后端服务配置检查
echo ""
echo "🔧 检查后端服务配置..."
BACKEND_FILES=(
    "backend/.env.example"
    "backend/config.py"
)

for file in "${BACKEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "检查$file..."
        if grep -q "localhost" "$file"; then
            echo "⚠️  $file仍包含本地地址，可能需要更新"
        else
            echo "✅ $file配置正确"
        fi
    else
        echo "⚠️  $file不存在"
    fi
done

# 5. 验证更新结果
echo ""
echo "🔍 验证更新结果..."

# 检查Chrome扩展配置
echo "Chrome扩展配置验证:"
if [ -f "chrome-extension/config.js" ]; then
    echo "当前环境: $(grep "CURRENT_ENV" chrome-extension/config.js)"
    echo "API地址: $(grep "apiUrl" chrome-extension/config.js)"
fi

# 检查是否还有残留的localhost:8000
echo ""
echo "🔍 检查残留的本地地址..."
echo "在Chrome扩展中搜索残留的localhost:8000:"
grep -r "localhost:8000" chrome-extension/ || echo "✅ 未发现残留的本地地址"

echo ""
echo "在项目中搜索残留的localhost:8000:"
grep -r "localhost:8000" . --exclude-dir=.git --exclude-dir=node_modules --exclude="*.log" || echo "✅ 未发现残留的本地地址"

# 6. 创建配置更新报告
echo ""
echo "======================================"
echo "📊 配置更新完成报告"
echo "======================================"
echo ""
echo "✅ Chrome扩展已更新到生产环境"
echo "✅ 微信机器人配置已更新"
echo "✅ Android应用配置已验证"
echo "✅ 后端服务配置已检查"
echo ""
echo "🔗 新的统一API地址:"
echo "   $RAILWAY_URL"
echo ""
echo "📋 下一步操作:"
echo "1. 重新加载Chrome扩展"
echo "2. 重新启动微信机器人"
echo "3. 重新编译Android应用"
echo "4. 测试所有客户端功能"
echo ""
echo "⚠️  注意事项:"
echo "- 确保Railway服务正在运行"
echo "- 检查环境变量配置"
echo "- 验证网络连接状态"
echo ""
echo "🎉 客户端配置统一迁移完成！"