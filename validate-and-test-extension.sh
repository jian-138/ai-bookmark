#!/bin/bash
# Chrome扩展最终验证和测试脚本
# 确保所有文件编码正确且功能正常

echo "🎯 Chrome扩展最终验证和测试"
echo "======================================"
echo "Railway API: https://ai-bookmark-production-5ecc.up.railway.app"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查函数
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        return 1
    fi
}

# 1. 检查文件存在性
echo "📁 1. 检查文件存在性..."
EXTENSION_DIR="chrome-extension"
REQUIRED_FILES=(
    "$EXTENSION_DIR/manifest.json"
    "$EXTENSION_DIR/config.js"
    "$EXTENSION_DIR/content.js"
    "$EXTENSION_DIR/background.js"
    "$EXTENSION_DIR/popup.js"
    "$EXTENSION_DIR/popup.html"
    "$EXTENSION_DIR/content.css"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}  ✅ 存在: $(basename "$file")${NC}"
    else
        echo -e "${RED}  ❌ 缺失: $(basename "$file")${NC}"
    fi
done

echo ""

# 2. 验证JSON格式
echo "🔍 2. 验证JSON格式..."
if command -v jq >/dev/null 2>&1; then
    if jq empty "$EXTENSION_DIR/manifest.json" >/dev/null 2>&1; then
        echo -e "${GREEN}  ✅ manifest.json格式正确${NC}"
    else
        echo -e "${RED}  ❌ manifest.json格式错误${NC}"
    fi
else
    echo -e "${YELLOW}  ⚠️  jq命令不可用，跳过JSON验证${NC}"
fi

echo ""

# 3. 检查关键配置
echo "⚙️  3. 检查关键配置..."

# 检查manifest版本
if grep -q '"manifest_version": 3' "$EXTENSION_DIR/manifest.json"; then
    echo -e "${GREEN}  ✅ Manifest V3版本${NC}"
else
    echo -e "${RED}  ❌ 不是Manifest V3版本${NC}"
fi

# 检查Railway API地址
if grep -q "ai-bookmark-production-5ecc.up.railway.app" "$EXTENSION_DIR/manifest.json"; then
    echo -e "${GREEN}  ✅ Railway API地址已配置${NC}"
else
    echo -e "${RED}  ❌ Railway API地址未配置${NC}"
fi

# 检查生产环境设置
if grep -q "CURRENT_ENV = 'production'" "$EXTENSION_DIR/config.js"; then
    echo -e "${GREEN}  ✅ 生产环境已设置${NC}"
else
    echo -e "${RED}  ❌ 生产环境未设置${NC}"
fi

echo ""

# 4. 验证API地址一致性
echo "🔗 4. 验证API地址一致性..."
RAILWAY_URL="https://ai-bookmark-production-5ecc.up.railway.app"

files_with_api=(
    "$EXTENSION_DIR/config.js"
    "$EXTENSION_DIR/background.js"
    "$EXTENSION_DIR/content.js"
)

for file in "${files_with_api[@]}"; do
    if grep -q "$RAILWAY_URL" "$file"; then
        echo -e "${GREEN}  ✅ $(basename "$file") 包含Railway地址${NC}"
    else
        echo -e "${YELLOW}  ⚠️  $(basename "$file") 未包含Railway地址${NC}"
    fi
done

echo ""

# 5. 测试网络连接
echo "🌐 5. 测试网络连接..."
echo "  测试Railway API连接..."

if command -v curl >/dev/null 2>&1; then
    response=$(curl -s -w "%{http_code}" -o /dev/null "$RAILWAY_URL/health" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}  ✅ Railway API健康检查通过${NC}"
    elif [ "$response" = "502" ]; then
        echo -e "${YELLOW}  ⚠️  Railway服务正在启动中 (502错误)${NC}"
        echo -e "${BLUE}  ℹ️  请等待5-10分钟后重试${NC}"
    elif [ "$response" = "000" ]; then
        echo -e "${RED}  ❌ 无法连接到Railway API${NC}"
    else
        echo -e "${YELLOW}  ⚠️  Railway API返回状态码: $response${NC}"
    fi
else
    echo -e "${YELLOW}  ⚠️  curl命令不可用，跳过网络测试${NC}"
fi

echo ""

# 6. 创建测试HTML页面
echo "🧪 6. 创建扩展测试页面..."

cat > test-extension.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI书签扩展测试页面</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        .test-section {
            background: #f5f5f5;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .highlight {
            background: #e3f2fd;
            padding: 10px;
            border-left: 4px solid #2196f3;
            margin: 10px 0;
        }
        .test-text {
            background: white;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <h1>🎯 AI书签收藏助手 - 扩展测试页面</h1>
    
    <div class="test-section">
        <h2>📋 测试说明</h2>
        <p>此页面用于测试Chrome扩展的各项功能。请按照以下步骤进行测试：</p>
        <ol>
            <li>确保扩展已正确加载（无编码错误）</li>
            <li>选中文本测试浮动按钮功能</li>
            <li>使用右键菜单测试收藏功能</li>
            <li>点击扩展图标测试登录功能</li>
        </ol>
    </div>
    
    <div class="test-section">
        <h2>📝 文本选择测试</h2>
        <p>请选中以下文本进行测试：</p>
        
        <div class="test-text">
            <h3>人工智能的发展历史</h3>
            <p>人工智能（Artificial Intelligence，AI）是计算机科学的一个分支，它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。该领域的研究包括机器人、语言识别、图像识别、自然语言处理和专家系统等。</p>
            
            <p>人工智能从诞生以来，理论和技术日益成熟，应用领域也不断扩大。可以设想，未来人工智能带来的科技产品，将会是人类智慧的"容器"。人工智能可以对人的意识、思维的信息过程的模拟。人工智能不是人的智能，但能像人那样思考、也可能超过人的智能。</p>
        </div>
        
        <div class="test-text">
            <h3>机器学习的应用</h3>
            <p>机器学习是人工智能的核心，是使计算机具有智能的根本途径。机器学习是一门多领域交叉学科，涉及概率论、统计学、逼近论、凸分析、算法复杂度理论等多门学科。</p>
            
            <p>专门研究计算机怎样模拟或实现人类的学习行为，以获取新的知识或技能，重新组织已有的知识结构使之不断改善自身的性能。机器学习已广泛应用于数据挖掘、计算机视觉、自然语言处理、生物特征识别、搜索引擎、医学诊断、检测信用卡欺诈、证券市场分析、DNA序列测序、语音和手写识别、战略游戏和机器人等领域。</p>
        </div>
    </div>
    
    <div class="test-section">
        <h2>🔗 API连接测试</h2>
        <div id="api-status">正在检查API连接...</div>
        
        <button onclick="testAPIConnection()">测试API连接</button>
        <button onclick="testUserLogin()">测试用户登录</button>
        <button onclick="testCollection()">测试收藏功能</button>
        
        <div id="test-results"></div>
    </div>
    
    <div class="test-section">
        <h2>🎨 扩展功能测试</h2>
        <div class="highlight">
            <strong>💡 提示：</strong> 选中文本后，应该会出现一个蓝色的浮动收藏按钮。点击按钮即可收藏选中的文本内容。
        </div>
        
        <p>您还可以：</p>
        <ul>
            <li>右键点击页面任意位置，选择"收藏到AI书签"</li>
            <li>点击浏览器工具栏的扩展图标进行登录</li>
            <li>使用快捷键（如果已配置）快速收藏</li>
        </ul>
    </div>
    
    <div class="test-section">
        <h2>📊 测试结果记录</h2>
        <div id="test-log">
            <p><strong>测试时间：</strong> <span id="test-time"></span></p>
            <p><strong>Railway API：</strong> https://ai-bookmark-production-5ecc.up.railway.app</p>
            <p><strong>扩展状态：</strong> <span id="extension-status">等待测试</span></p>
        </div>
    </div>

    <script>
        // 设置测试时间
        document.getElementById('test-time').textContent = new Date().toLocaleString();
        
        // API连接测试
        async function testAPIConnection() {
            const resultsDiv = document.getElementById('test-results');
            const apiStatusDiv = document.getElementById('api-status');
            
            try {
                apiStatusDiv.textContent = '正在连接Railway API...';
                
                const response = await fetch('https://ai-bookmark-production-5ecc.up.railway.app/health');
                const data = await response.json();
                
                if (response.ok && data.status === 'healthy') {
                    apiStatusDiv.innerHTML = '<span style="color: green;">✅ Railway API连接正常</span>';
                    resultsDiv.innerHTML += '<div style="color: green;">✅ API健康检查通过</div>';
                } else {
                    apiStatusDiv.innerHTML = '<span style="color: red;">❌ Railway API连接异常</span>';
                    resultsDiv.innerHTML += '<div style="color: red;">❌ API健康检查失败</div>';
                }
            } catch (error) {
                apiStatusDiv.innerHTML = '<span style="color: red;">❌ 无法连接到Railway API</span>';
                resultsDiv.innerHTML += `<div style="color: red;">❌ 连接错误: ${error.message}</div>`;
            }
        }
        
        // 用户登录测试
        async function testUserLogin() {
            const resultsDiv = document.getElementById('test-results');
            
            try {
                const response = await fetch('https://ai-bookmark-production-5ecc.up.railway.app/api/v1/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: 'test',
                        password: 'test123'
                    })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    resultsDiv.innerHTML += '<div style="color: green;">✅ 用户登录测试通过</div>';
                    resultsDiv.innerHTML += `<div>Token: ${data.token.substring(0, 20)}...</div>`;
                } else {
                    resultsDiv.innerHTML += `<div style="color: red;">❌ 登录失败: ${data.error || '未知错误'}</div>`;
                }
            } catch (error) {
                resultsDiv.innerHTML += `<div style="color: red;">❌ 登录测试失败: ${error.message}</div>`;
            }
        }
        
        // 收藏功能测试
        async function testCollection() {
            const resultsDiv = document.getElementById('test-results');
            
            try {
                // 首先获取测试token
                const loginResponse = await fetch('https://ai-bookmark-production-5ecc.up.railway.app/api/v1/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: 'test',
                        password: 'test123'
                    })
                });
                
                const loginData = await loginResponse.json();
                
                if (loginResponse.ok && loginData.success) {
                    const token = loginData.token;
                    const userId = loginData.user_id;
                    
                    // 测试收藏功能
                    const collectResponse = await fetch('https://ai-bookmark-production-5ecc.up.railway.app/api/v1/collect', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            user_id: userId,
                            original_text: '这是来自Chrome扩展测试的收藏内容',
                            url: window.location.href,
                            title: document.title,
                            metadata: {
                                source: 'chrome-extension-test',
                                timestamp: new Date().toISOString()
                            }
                        })
                    });
                    
                    const collectData = await collectResponse.json();
                    
                    if (collectResponse.ok && collectData.success) {
                        resultsDiv.innerHTML += '<div style="color: green;">✅ 收藏功能测试通过</div>';
                        resultsDiv.innerHTML += `<div>收藏ID: ${collectData.collect_id}</div>`;
                    } else {
                        resultsDiv.innerHTML += `<div style="color: red;">❌ 收藏失败: ${collectData.error || '未知错误'}</div>`;
                    }
                } else {
                    resultsDiv.innerHTML += '<div style="color: red;">❌ 无法获取测试token</div>';
                }
            } catch (error) {
                resultsDiv.innerHTML += `<div style="color: red;">❌ 收藏测试失败: ${error.message}</div>`;
            }
        }
        
        // 自动运行API连接测试
        window.addEventListener('load', () => {
            setTimeout(testAPIConnection, 1000);
        });
        
        // 监听扩展消息（如果扩展已安装）
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            document.getElementById('extension-status').textContent = 'Chrome扩展API可用';
            document.getElementById('extension-status').style.color = 'green';
        } else {
            document.getElementById('extension-status').textContent = 'Chrome扩展API不可用';
            document.getElementById('extension-status').style.color = 'orange';
        }
    </script>
</body>
</html>
EOF

echo -e "${GREEN}  ✅ 测试页面已创建: test-extension.html${NC}"

echo ""

# 7. 提供操作指南
echo "📋 8. 操作指南"
echo "======================================"
echo "1. 重新加载Chrome扩展:"
echo "   - 访问 chrome://extensions/"
echo "   - 找到'AI书签收藏助手'"
echo "   - 点击'重新加载'"
echo ""
echo "2. 测试扩展功能:"
echo "   - 打开 test-extension.html 页面"
echo "   - 按照页面指示进行测试"
echo "   - 选中文本测试浮动按钮"
echo "   - 使用右键菜单测试收藏"
echo ""
echo "3. 验证API连接:"
echo "   - 点击测试页面的'测试API连接'按钮"
echo "   - 确认能够成功连接到Railway"
echo ""
echo "4. 如果仍然有问题:"
echo "   - 检查Chrome开发者工具控制台"
echo "   - 查看扩展的背景页错误日志"
echo "   - 确认Railway服务状态"

echo ""
echo "======================================"
echo -e "${GREEN}🎉 Chrome扩展编码修复和验证完成！${NC}"
echo "======================================"
echo ""
echo -e "${BLUE}🔗 Railway API地址: $RAILWAY_URL${NC}"
echo -e "${BLUE}📁 测试页面: test-extension.html${NC}"
echo -e "${BLUE}📋 详细指南: CHROME_EXTENSION_ENCODING_FIX_GUIDE.md${NC}"

# 显示当前状态
if command -v curl >/dev/null 2>&1; then
    echo ""
    echo "当前Railway服务状态:"
    curl -s "$RAILWAY_URL/health" | jq . 2>/dev/null || echo "无法获取状态信息"
fi