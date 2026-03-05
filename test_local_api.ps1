# Test local API endpoints
Write-Host "Testing local API endpoints..."

try {
    # Test health endpoint
    Write-Host "`nTesting health endpoint..."
    $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method GET
    Write-Host "Health check: $($health | ConvertTo-Json -Depth 10)"
    
    # Test login endpoint
    Write-Host "`nTesting login endpoint..."
    $loginBody = @{
        username = "test"
        password = "test123"
    } | ConvertTo-Json
    
    $login = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "Login response: $($login | ConvertTo-Json -Depth 10)"
    
    Write-Host "`n✅ Local API tests completed successfully!"
} catch {
    Write-Host "`n❌ Local API test failed: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "Status code: $($_.Exception.Response.StatusCode)"
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody"
    }
}