# Railway环境配置脚本 (PowerShell)

Write-Host "设置Railway环境变量..." -ForegroundColor Green

# 设置基本环境变量
railway variables set ENVIRONMENT=production
railway variables set PORT=8000
railway variables set PYTHONUNBUFFERED=1
railway variables set PYTHONDONTWRITEBYTECODE=1

# 检查必要的环境变量
if (-not $env:DATABASE_URL) {
    Write-Host "请设置DATABASE_URL环境变量" -ForegroundColor Yellow
}

if (-not $env:SILICONFLOW_API_KEY) {
    Write-Host "请设置SILICONFLOW_API_KEY环境变量" -ForegroundColor Yellow
}

Write-Host "环境变量设置完成" -ForegroundColor Green
Write-Host "当前环境变量:" -ForegroundColor Cyan
railway variables