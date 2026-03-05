# 立即测试本地API登录功能
Write-Host "🧪 测试本地服务器登录功能..." -ForegroundColor Green

try {
    # 测试健康检查
    Write-Host "📡 测试健康检查端点..." -ForegroundColor Cyan
    $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method GET
    Write-Host "✅ 健康检查正常: $($health | ConvertTo-Json -Depth 10)" -ForegroundColor Green
    
    # 测试登录
    Write-Host "`n🔐 测试登录功能..." -ForegroundColor Cyan
    $loginBody = @{
        username = "test"
        password = "test123"
    } | ConvertTo-Json
    
    $login = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✅ 登录成功!" -ForegroundColor Green
    Write-Host "🎫 Token: $($login.token)" -ForegroundColor Yellow
    Write-Host "👤 User ID: $($login.user_id)" -ForegroundColor Yellow
    Write-Host "💬 消息: $($login.message)" -ForegroundColor Yellow
    
    # 测试收藏列表
    Write-Host "`n📚 测试收藏列表..." -ForegroundColor Cyan
    $collections = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/collections?page=1&size=5" -Method GET
    Write-Host "✅ 收藏列表获取成功" -ForegroundColor Green
    Write-Host "📊 总收藏数: $($collections.total)" -ForegroundColor White
    Write-Host "📄 当前页收藏数: $($collections.items.Count)" -ForegroundColor White
    
    Write-Host "`n🎉 所有测试通过！本地服务器运行正常" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ 测试失败: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "📊 状态码: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            Write-Host "📄 错误响应: $responseBody" -ForegroundColor Red
        } catch {
            Write-Host "无法读取错误详情" -ForegroundColor Yellow
        }
    }
}