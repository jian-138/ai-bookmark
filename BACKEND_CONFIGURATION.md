# 后端配置说明

## 当前状态

你的应用显示的网络错误是**正常的**，因为：

```
Network error: Unable to resolve host "api.example.com": 
No address associated with hostname
```

这是因为代码中使用的是示例域名 `https://api.example.com`，这不是真实的服务器地址。

## 如何配置真实的后端地址

### 方法1：修改NetworkModule.kt（推荐用于开发）

打开文件：`app/src/main/java/com/example/aicollector/di/NetworkModule.kt`

找到这一行：
```kotlin
private const val BASE_URL = "https://api.example.com" // TODO: Replace with actual API URL
```

替换为你的真实后端地址，例如：

**本地开发（使用模拟器）：**
```kotlin
private const val BASE_URL = "http://10.0.2.2:5000"  // Android模拟器访问本机
```

**本地开发（使用真机）：**
```kotlin
private const val BASE_URL = "http://192.168.1.100:5000"  // 替换为你电脑的局域网IP
```

**生产环境：**
```kotlin
private const val BASE_URL = "https://your-api-domain.com"  // 你的真实域名
```

### 方法2：使用BuildConfig（推荐用于生产）

在 `app/build.gradle.kts` 中添加不同环境的配置：

```kotlin
buildTypes {
    debug {
        buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:5000\"")
        buildConfigField("boolean", "DEV_MODE_ENABLED", "true")
    }
    release {
        buildConfigField("String", "API_BASE_URL", "\"https://your-api-domain.com\"")
        buildConfigField("boolean", "DEV_MODE_ENABLED", "false")
    }
}
```

然后在 `NetworkModule.kt` 中使用：
```kotlin
private const val BASE_URL = BuildConfig.API_BASE_URL
```

## 开发模式测试

如果你想在没有后端的情况下测试应用，可以：

1. **使用开发模式登录**
   - 用户名：`test`
   - 密码：`test123`
   - 这会生成模拟token，但收藏功能仍需要后端

2. **启动本地后端**
   - 进入 `backend` 目录
   - 运行 `python -m flask run` 或类似命令
   - 确保后端运行在正确的端口

3. **使用Mock服务器**
   - 可以使用工具如 Postman Mock Server
   - 或者使用 json-server 快速搭建测试API

## 网络安全配置

如果使用HTTP（非HTTPS）进行本地开发，需要配置网络安全：

文件已存在：`app/src/main/res/xml/network_security_config.xml`

确保包含：
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
```

## 验证配置

配置完成后：

1. **重新构建应用**
   ```bash
   ./gradlew clean
   ./gradlew assembleDebug
   ```

2. **检查日志**
   - 打开 Android Studio 的 Logcat
   - 过滤 "OkHttp" 或 "Retrofit"
   - 查看实际请求的URL

3. **测试连接**
   - 尝试登录（如果有真实后端）
   - 或使用开发模式登录
   - 查看网络请求是否成功

## 常见问题

### Q: 模拟器无法访问本机服务器
**A:** 使用 `10.0.2.2` 而不是 `localhost` 或 `127.0.0.1`

### Q: 真机无法访问电脑上的服务器
**A:** 
- 确保手机和电脑在同一WiFi网络
- 使用电脑的局域网IP（如 `192.168.1.100`）
- 关闭电脑防火墙或添加端口例外

### Q: HTTPS证书错误
**A:** 
- 开发环境使用HTTP
- 生产环境使用有效的SSL证书
- 不要在生产环境禁用证书验证

## 当前应用状态

✅ 应用名称已更新为"AI书签"  
✅ 开发模式已配置（可使用test/test123登录）  
✅ API接口已对齐后端文档v1.1  
⚠️ 需要配置真实的后端地址  

## 下一步

1. 确定你的后端地址
2. 修改 `NetworkModule.kt` 中的 `BASE_URL`
3. 重新构建并运行应用
4. 测试登录和收藏功能

如果后端还未部署，可以先使用开发模式测试UI和本地功能。
