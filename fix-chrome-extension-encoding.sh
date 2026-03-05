# Chrome扩展编码修复和验证脚本
# 用于解决UTF-8编码问题和manifest加载错误

RAILWAY_URL="https://ai-bookmark-production-5ecc.up.railway.app"

echo "🔧 Chrome扩展编码修复和验证工具"
echo "======================================"
echo "Railway API地址: $RAILWAY_URL"
echo ""

# Chrome扩展目录
EXTENSION_DIR="chrome-extension"

# 检查文件编码的函数
check_file_encoding() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "检查文件编码: $(basename "$file")"
        
        # 使用file命令检查编码
        if command -v file >/dev/null 2>&1; then
            encoding=$(file -b --mime-encoding "$file")
            echo "  编码: $encoding"
            
            if [[ "$encoding" != "utf-8" && "$encoding" != "us-ascii" ]]; then
                echo "  ⚠️  需要转换为UTF-8"
                return 1
            else
                echo "  ✅ UTF-8编码正确"
                return 0
            fi
        else
            echo "  ℹ️  file命令不可用，跳过编码检查"
            return 0
        fi
    else
        echo "❌ 文件不存在: $file"
        return 1
    fi
}

# 修复文件编码的函数
fix_file_encoding() {
    local file="$1"
    local temp_file="${file}.tmp"
    
    echo "修复文件编码: $(basename "$file")"
    
    # 使用iconv转换编码（如果可用）
    if command -v iconv >/dev/null 2>&1; then
        # 尝试从常见编码转换为UTF-8
        if iconv -f ISO-8859-1 -t UTF-8 "$file" > "$temp_file" 2>/dev/null; then
            mv "$temp_file" "$file"
            echo "  ✅ 编码转换完成 (ISO-8859-1 -> UTF-8)"
        elif iconv -f WINDOWS-1252 -t UTF-8 "$file" > "$temp_file" 2>/dev/null; then
            mv "$temp_file" "$file"
            echo "  ✅ 编码转换完成 (WINDOWS-1252 -> UTF-8)"
        else
            echo "  ⚠️  自动编码转换失败，请手动检查"
            rm -f "$temp_file"
        fi
    else
        echo "  ℹ️  iconv命令不可用，跳过编码转换"
    fi
}

# 验证manifest.json的函数
validate_manifest() {
    local manifest_file="$EXTENSION_DIR/manifest.json"
    
    echo "验证manifest.json..."
    
    if [ -f "$manifest_file" ]; then
        # 检查JSON格式
        if command -v jq >/dev/null 2>&1; then
            if jq empty "$manifest_file" >/dev/null 2>&1; then
                echo "  ✅ JSON格式正确"
            else
                echo "  ❌ JSON格式错误"
                return 1
            fi
        else
            echo "  ℹ️  jq命令不可用，跳过JSON验证"
        fi
        
        # 检查必需字段
        if grep -q '"manifest_version"' "$manifest_file"; then
            echo "  ✅ manifest_version字段存在"
        else
            echo "  ❌ manifest_version字段缺失"
            return 1
        fi
        
        if grep -q '"name"' "$manifest_file"; then
            echo "  ✅ name字段存在"
        else
            echo "  ❌ name字段缺失"
            return 1
        fi
        
        if grep -q '"version"' "$manifest_file"; then
            echo "  ✅ version字段存在"
        else
            echo "  ❌ version字段缺失"
            return 1
        fi
        
        # 检查host_permissions
        if grep -q "$RAILWAY_URL" "$manifest_file"; then
            echo "  ✅ Railway API地址已配置"
        else
            echo "  ❌ Railway API地址未配置"
            return 1
        fi
        
    else
        echo "  ❌ manifest.json文件不存在"
        return 1
    fi
}

# 重新创建关键文件的函数
recreate_critical_files() {
    echo "重新创建关键文件..."
    
    # 重新创建manifest.json
    cat > "$EXTENSION_DIR/manifest.json" << 'EOF'
{
  "manifest_version": 3,
  "name": "AI书签收藏助手",
  "version": "1.0.0",
  "description": "AI驱动的智能书签系统，选中文本一键收藏并自动分析分类",
  "permissions": [
    "storage",
    "contextMenus",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "https://ai-bookmark-production-5ecc.up.railway.app/*"
  ],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "action": {
    "default_popup": "popup.html",
    "default_title": "AI书签收藏助手"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_end"
    }
  ],
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
EOF
    echo "  ✅ manifest.json已重新创建"
    
    # 重新创建config.js
    cat > "$EXTENSION_DIR/config.js" << 'EOF'
// 配置文件 - API设置
const Config = {
  // 开发环境配置
  development: {
    apiUrl: 'http://localhost:8000',
    name: 'Development'
  },
  
  // 生产环境配置
  production: {
    apiUrl: 'https://ai-bookmark-production-5ecc.up.railway.app',
    name: 'Production'
  }
};

// 当前环境 - 设为'development'或'production'
const CURRENT_ENV = 'production';

// 导出当前配置
const API_CONFIG = Config[CURRENT_ENV];

console.log(`使用${API_CONFIG.name}环境API: ${API_CONFIG.apiUrl}`);

export { API_CONFIG };
EOF
    echo "  ✅ config.js已重新创建"
}

# 主函数
main() {
    echo "开始Chrome扩展编码修复和验证..."
    echo ""
    
    # 检查目录
    if [ ! -d "$EXTENSION_DIR" ]; then
        echo "❌ Chrome扩展目录不存在: $EXTENSION_DIR"
        exit 1
    fi
    
    # 关键文件列表
    CRITICAL_FILES=(
        "$EXTENSION_DIR/manifest.json"
        "$EXTENSION_DIR/config.js"
        "$EXTENSION_DIR/content.js"
        "$EXTENSION_DIR/background.js"
        "$EXTENSION_DIR/popup.js"
    )
    
    echo "1. 检查文件编码..."
    for file in "${CRITICAL_FILES[@]}"; do
        if ! check_file_encoding "$file"; then
            echo ""
            echo "2. 修复文件编码..."
            fix_file_encoding "$file"
        fi
    done
    
    echo ""
    echo "3. 验证manifest.json..."
    if ! validate_manifest; then
        echo ""
        echo "4. 重新创建关键文件..."
        recreate_critical_files
    fi
    
    echo ""
    echo "5. 最终验证..."
    echo "检查Railway API地址配置:"
    if grep -q "$RAILWAY_URL" "$EXTENSION_DIR/manifest.json"; then
        echo "  ✅ Railway API地址正确配置"
    else
        echo "  ❌ Railway API地址配置错误"
    fi
    
    echo ""
    echo "======================================"
    echo "🔧 编码修复和验证完成！"
    echo "======================================"
    echo ""
    echo "下一步操作："
    echo "1. 重新加载Chrome扩展"
    echo "2. 测试扩展功能"
    echo "3. 验证与Railway的连接"
    echo ""
    echo "🔗 Railway API地址: $RAILWAY_URL"
    echo "📁 Chrome扩展目录: $EXTENSION_DIR"
}

# 运行主函数
main "$@"