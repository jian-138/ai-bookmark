# Test API endpoints
Write-Host "Testing Railway API endpoints..."

try {
    # Test health endpoint
    Write-Host "`nTesting health endpoint..."
    $health = Invoke-RestMethod -Uri "https://ai-bookmark-production-5ecc.up.railway.app/health" -Method GET
    Write-Host "Health check: $($health | ConvertTo-Json -Depth 10)"
    
    # Test login endpoint
    Write-Host "`nTesting login endpoint..."
    $loginBody = @{
        username = "test"
        password = "test123"
    } | ConvertTo-Json
    
    $login = Invoke-RestMethod -Uri "https://ai-bookmark-production-5ecc.up.railway.app/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "Login response: $($login | ConvertTo-Json -Depth 10)"
    
    Write-Host "`n✅ API tests completed successfully!"
} catch {
    Write-Host "`n❌ API test failed: $($_.Exception.Message)"
    Write-Host "Error details: $($_.Exception.Response)"
}