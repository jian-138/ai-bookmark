# Chrome扩展编码修复脚本
# 修复PowerShell批量替换导致的编码问题

# 设置UTF-8编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'UTF8'

Write-Host "🔧 Chrome扩展编码修复工具" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

$railwayUrl = "https://ai-bookmark-production-5ecc.up.railway.app"
$extensionDir = "chrome-extension"

# 检查目录是否存在
if (-not (Test-Path $extensionDir)) {
    Write-Host "❌ Chrome扩展目录不存在: $extensionDir" -ForegroundColor Red
    exit 1
}

Write-Host "Railway API地址: $railwayUrl" -ForegroundColor Yellow
Write-Host "扩展目录: $extensionDir" -ForegroundColor Yellow
Write-Host ""

# 需要修复的关键文件
$criticalFiles = @(
    "manifest.json",
    "config.js", 
    "content.js",
    "background.js",
    "popup.js",
    "popup.html"
)

# 函数：检查文件编码
function Test-FileEncoding {
    param($filePath)
    
    try {
        $content = Get-Content $filePath -Raw -ErrorAction Stop
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        
        # 检查是否有非UTF-8字符
        $hasInvalidChars = $false
        foreach ($byte in $bytes) {
            if ($byte -gt 127 -and $byte -lt 194) {
                $hasInvalidChars = $true
                break
            }
        }
        
        return @{
            Path = $filePath
            Encoding = if ($hasInvalidChars) { "非UTF-8" } else { "UTF-8" }
            Status = if ($hasInvalidChars) { "需要修复" } else { "正常" }
        }
    }
    catch {
        return @{
            Path = $filePath
            Encoding = "未知"
            Status = "错误: $($_.Exception.Message)"
        }
    }
}

# 函数：修复文件编码
function Repair-FileEncoding {
    param($filePath)
    
    Write-Host "修复文件编码: $(Split-Path $filePath -Leaf)" -ForegroundColor Cyan
    
    try {
        # 读取文件内容
        $content = Get-Content $filePath -Raw -ErrorAction Stop
        
        # 移除可能的BOM字符和无效字符
        $cleanContent = $content -replace "`u{FEFF}", ""  # 移除BOM
        $cleanContent = $content -replace "[^\x00-\x7F]", ""  # 移除非ASCII字符（临时）
        
        # 重新写入文件，确保UTF-8编码
        [System.IO.File]::WriteAllText($filePath, $cleanContent, [System.Text.Encoding]::UTF8)
        
        Write-Host "  ✅ 编码修复完成" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "  ❌ 编码修复失败: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# 函数：重新创建关键文件
function New-CriticalFiles {
    Write-Host "重新创建关键文件..." -ForegroundColor Yellow
    
    # manifest.json
    $manifestContent = @"
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
    "$railwayUrl/*"
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
"@
    
    [System.IO.File]::WriteAllText("$extensionDir/manifest.json", $manifestContent, [System.Text.Encoding]::UTF8)
    Write-Host "  ✅ manifest.json 已重新创建" -ForegroundColor Green
    
    # config.js
    $configContent = @"
// 配置文件 - API设置
const Config = {
  // 开发环境配置
  development: {
    apiUrl: 'http://localhost:8000',
    name: 'Development'
  },
  
  // 生产环境配置
  production: {
    apiUrl: '$railwayUrl',
    name: 'Production'
  }
};

// 当前环境 - 设为'development'或'production'
const CURRENT_ENV = 'production';

// 导出当前配置
const API_CONFIG = Config[CURRENT_ENV];

console.log(`使用`${API_CONFIG.name}`环境API: `${API_CONFIG.apiUrl}`);

export { API_CONFIG };
"@
    
    [System.IO.File]::WriteAllText("$extensionDir/config.js", $configContent, [System.Text.Encoding]::UTF8)
    Write-Host "  ✅ config.js 已重新创建" -ForegroundColor Green
}

# 主执行流程
Write-Host "1. 检查文件编码状态..." -ForegroundColor Yellow

$encodingResults = @()
foreach ($file in $criticalFiles) {
    $filePath = Join-Path $extensionDir $file
    if (Test-Path $filePath) {
        $result = Test-FileEncoding $filePath
        $encodingResults += $result
        
        $color = if ($result.Status -eq "正常") { "Green" } else { "Red" }
        Write-Host "  $(Split-Path $filePath -Leaf): $($result.Status)" -ForegroundColor $color
    } else {
        Write-Host "  ⚠️ $(Split-Path $filePath -Leaf): 文件不存在" -ForegroundColor Yellow
    }
}

Write-Host ""

# 统计需要修复的文件
$filesToRepair = $encodingResults | Where-Object { $_.Status -ne "正常" }

if ($filesToRepair.Count -gt 0) {
    Write-Host "2. 修复编码问题..." -ForegroundColor Yellow
    
    foreach ($file in $filesToRepair) {
        Repair-FileEncoding $file.Path
    }
} else {
    Write-Host "2. 未发现编码问题" -ForegroundColor Green
}

Write-Host ""
Write-Host "3. 验证manifest.json..." -ForegroundColor Yellow

$manifestPath = "$extensionDir/manifest.json"
if (Test-Path $manifestPath) {
    try {
        $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json -ErrorAction Stop
        
        Write-Host "  ✅ JSON格式正确" -ForegroundColor Green
        Write-Host "  ✅ 名称: $($manifest.name)" -ForegroundColor Green
        Write-Host "  ✅ 版本: $($manifest.version)" -ForegroundColor Green
        
        if ($manifest.host_permissions -contains "$railwayUrl/*") {
            Write-Host "  ✅ Railway API地址已配置" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Railway API地址未正确配置" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  ❌ JSON格式错误，重新创建文件..." -ForegroundColor Red
        New-CriticalFiles
    }
} else {
    Write-Host "  ⚠️ manifest.json不存在，重新创建..." -ForegroundColor Yellow
    New-CriticalFiles
}

Write-Host ""
Write-Host "4. 最终验证..." -ForegroundColor Yellow

# 检查是否还有localhost引用
$localhostRefs = Select-String -Path "$extensionDir\*.js" -Pattern "localhost:8000" -List
if ($localhostRefs) {
    Write-Host "  ⚠️  发现localhost引用，需要更新:" -ForegroundColor Yellow
    foreach ($ref in $localhostRefs) {
        Write-Host "    $($ref.Filename): 第$($ref.LineNumber)行" -ForegroundColor Cyan
    }
} else {
    Write-Host "  ✅ 未发现localhost引用" -ForegroundColor Green
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "🔧 编码修复完成！" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "下一步操作：" -ForegroundColor Yellow
Write-Host "1. 重新加载Chrome扩展" -ForegroundColor White
Write-Host "2. 测试扩展功能" -ForegroundColor White
Write-Host "3. 验证Railway连接" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Railway API地址: $railwayUrl" -ForegroundColor Cyan
Write-Host "📁 扩展目录: $extensionDir" -ForegroundColor Cyan