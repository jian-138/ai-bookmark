#!/bin/bash

# Chrome扩展配置更新脚本
# 将所有localhost:8000替换为Railway生产地址

RAILWAY_URL="https://ai-bookmark-production-5ecc.up.railway.app"
OLD_URL="http://localhost:8000"

echo "🚀 更新Chrome扩展到Railway生产环境"
echo "==================================="
echo "Railway地址: $RAILWAY_URL"
echo "旧地址: $OLD_URL"
echo ""

# Chrome扩展目录
EXTENSION_DIR="chrome-extension"

# 需要更新的文件列表
FILES_TO_UPDATE=(
    "config.js"
    "background.js"
    "content.js"
    "popup.js"
    "popup_module.js"
    "popup_simple_fix.js"
    "login_enhancer.js"
    "collection_loader.js"
    "collection_loader_enhanced.js"
    "post_collection_handler.js"
    "quick_login_fix.js"
    "test_connection.js"
    "weekly-favorite.js"
)

# 更新函数
update_file() {
    local file="$1"
    local filepath="$EXTENSION_DIR/$file"
    
    if [ -f "$filepath" ]; then
        echo "📄 更新文件: $file"
        
        # 使用sed替换（兼容不同系统）
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|$OLD_URL|$RAILWAY_URL|g" "$filepath"
        else
            # Linux/Windows
            sed -i "s|$OLD_URL|$RAILWAY_URL|g" "$filepath"
        fi
        
        # 验证更新
        if grep -q "$RAILWAY_URL" "$filepath"; then
            echo "✅ $file 更新成功"
        else
            echo "⚠️  $file 可能未完全更新"
        fi
    else
        echo "⚠️  文件不存在: $filepath"
    fi
}

# 创建备份
create_backup() {
    local backup_dir="$EXTENSION_DIR/backup_$(date +%Y%m%d_%H%M%S)"
    echo "💾 创建备份目录: $backup_dir"
    mkdir -p "$backup_dir"
    
    for file in "${FILES_TO_UPDATE[@]}"; do
        local filepath="$EXTENSION_DIR/$file"
        if [ -f "$filepath" ]; then
            cp "$filepath" "$backup_dir/"
        fi
    done
    
    echo "✅ 备份完成"
    echo ""
}

# 验证配置文件
verify_config() {
    echo "🔍 验证配置文件..."
    local config_file="$EXTENSION_DIR/config.js"
    
    if [ -f "$config_file" ]; then
        echo "当前环境配置:"
        grep "CURRENT_ENV" "$config_file"
        echo "API地址配置:"
        grep "apiUrl" "$config_file"
    fi
    echo ""
}

# 主函数
main() {
    echo "开始Chrome扩展配置更新..."
    echo ""
    
    # 创建备份
    create_backup
    
    # 更新所有文件
    for file in "${FILES_TO_UPDATE[@]}"; do
        update_file "$file"
    done
    
    echo ""
    echo "🔍 验证更新结果..."
    verify_config
    
    echo ""
    echo "==================================="
    echo "🎉 Chrome扩展配置更新完成！"
    echo ""
    echo "下一步操作："
    echo "1. 重新加载Chrome扩展"
    echo "2. 测试扩展功能"
    echo "3. 验证与Railway平台的连接"
    echo ""
    echo "🔗 新的API地址: $RAILWAY_URL"
    echo "📁 备份目录: $EXTENSION_DIR/backup_*"
}

# 运行主函数
main "$@"