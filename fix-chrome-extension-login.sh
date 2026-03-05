#!/bin/bash
# Chrome扩展登录修复脚本
# 替换原始文件为修复版本

echo "🔧 Chrome扩展登录功能修复"
echo "======================================"

EXTENSION_DIR="chrome-extension"

# 检查文件是否存在
if [ ! -d "$EXTENSION_DIR" ]; then
    echo "❌ Chrome扩展目录不存在: $EXTENSION_DIR"
    exit 1
fi

echo "📁 扩展目录: $EXTENSION_DIR"
echo ""

# 备份原始文件
echo "💾 备份原始文件..."

if [ -f "$EXTENSION_DIR/popup.js" ]; then
    cp "$EXTENSION_DIR/popup.js" "$EXTENSION_DIR/popup.js.backup"
    echo "  ✅ 备份 popup.js"
fi

if [ -f "$EXTENSION_DIR/background.js" ]; then
    cp "$EXTENSION_DIR/background.js" "$EXTENSION_DIR/background.js.backup"
    echo "  ✅ 备份 background.js"
fi

if [ -f "$EXTENSION_DIR/config.js" ]; then
    cp "$EXTENSION_DIR/config.js" "$EXTENSION_DIR/config.js.backup"
    echo "  ✅ 备份 config.js"
fi

if [ -f "$EXTENSION_DIR/popup.html" ]; then
    cp "$EXTENSION_DIR/popup.html" "$EXTENSION_DIR/popup.html.backup"
    echo "  ✅ 备份 popup.html"
fi

echo ""

# 替换为修复版本
echo "🛠️  替换为修复版本..."

if [ -f "$EXTENSION_DIR/popup_fixed.js" ]; then
    cp "$EXTENSION_DIR/popup_fixed.js" "$EXTENSION_DIR/popup.js"
    echo "  ✅ 替换 popup.js (修复版)"
else
    echo "  ❌ 找不到 popup_fixed.js"
fi

if [ -f "$EXTENSION_DIR/background_fixed.js" ]; then
    cp "$EXTENSION_DIR/background_fixed.js" "$EXTENSION_DIR/background.js"
    echo "  ✅ 替换 background.js (修复版)"
else
    echo "  ❌ 找不到 background_fixed.js"
fi

if [ -f "$EXTENSION_DIR/config_fixed.js" ]; then
    cp "$EXTENSION_DIR/config_fixed.js" "$EXTENSION_DIR/config.js"
    echo "  ✅ 替换 config.js (修复版)"
else
    echo "  ❌ 找不到 config_fixed.js"
fi

if [ -f "$EXTENSION_DIR/popup_fixed.html" ]; then
    cp "$EXTENSION_DIR/popup_fixed.html" "$EXTENSION_DIR/popup.html"
    echo "  ✅ 替换 popup.html (修复版)"
else
    echo "  ❌ 找不到 popup_fixed.html"
fi

echo ""

# 验证文件替换
echo "🔍 验证文件替换..."

if [ -f "$EXTENSION_DIR/popup.js" ]; then
    echo "  ✅ popup.js 已替换"
fi

if [ -f "$EXTENSION_DIR/background.js" ]; then
    echo "  ✅ background.js 已替换"
fi

if [ -f "$EXTENSION_DIR/config.js" ]; then
    echo "  ✅ config.js 已替换"
fi

if [ -f "$EXTENSION_DIR/popup.html" ]; then
    echo "  ✅ popup.html 已替换"
fi

echo ""

# 检查关键配置
echo "⚙️  检查关键配置..."

# 检查Railway API地址
if grep -q "ai-bookmark-production-5ecc.up.railway.app" "$EXTENSION_DIR/config.js"; then
    echo "  ✅ config.js 包含Railway API地址"
else
    echo "  ❌ config.js 缺少Railway API地址"
fi

# 检查生产环境设置
if grep -q "CURRENT_ENV = 'production'" "$EXTENSION_DIR/config.js"; then
    echo "  ✅ config.js 设置为生产环境"
else
    echo "  ❌ config.js 未设置为生产环境"
fi

# 检查登录功能
if grep -q "handleLogin" "$EXTENSION_DIR/background.js"; then
    echo "  ✅ background.js 包含登录处理函数"
else
    echo "  ❌ background.js 缺少登录处理函数"
fi

if grep -q "loginManager" "$EXTENSION_DIR/popup.js"; then
    echo "  ✅ popup.js 包含登录管理器"
else
    echo "  ❌ popup.js 缺少登录管理器"
fi

echo ""

# 测试网络连接
echo "🌐 测试网络连接..."
RAILWAY_URL="https://ai-bookmark-production-5ecc.up.railway.app"

if command -v curl >/dev/null 2>&1; then
    response=$(curl -s -w "%{http_code}" -o /dev/null "$RAILWAY_URL/health" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        echo "  ✅ Railway API健康检查通过"
    elif [ "$response" = "502" ]; then
        echo "  ⚠️  Railway服务正在启动中 (502错误)"
        echo "  ℹ️  请等待5-10分钟后重试"
    else
        echo "  ❌ 无法连接到Railway API (状态码: $response)"
    fi
else
    echo "  ℹ️  curl命令不可用，跳过网络测试"
fi

echo ""

# 提供操作指南
echo "📋 下一步操作："
echo "1. 重新加载Chrome扩展："
echo "   - 访问 chrome://extensions/"
echo "   - 找到'AI书签收藏助手'"
echo "   - 点击'重新加载'"
echo ""
echo "2. 测试登录功能："
echo "   - 点击扩展图标打开弹出窗口"
echo "   - 使用测试账号: test / test123"
echo "   - 检查是否能够成功登录"
echo ""
echo "3. 如果仍然有问题："
echo "   - 检查Chrome开发者工具控制台"
echo "   - 查看扩展的背景页错误日志"
echo "   - 确认Railway服务状态"
echo ""
echo "🔗 Railway API地址: $RAILWAY_URL"
echo "📁 扩展目录: $EXTENSION_DIR"
echo ""
echo "如果需要恢复原始文件："
echo "  - popup.js.backup -> popup.js"
echo "  - background.js.backup -> background.js"
echo "  - config.js.backup -> config.js"
echo "  - popup.html.backup -> popup.html"

echo ""
echo "======================================"
echo "🎉 Chrome扩展登录功能修复完成！"
echo "======================================"