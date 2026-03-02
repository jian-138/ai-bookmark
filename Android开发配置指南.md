# Android应用开发配置指南

## 🚀 快速开始（开箱即用）

项目默认配置为Railway生产环境，克隆后可直接运行：

```bash
# 1. 克隆项目
git clone https://github.com/jian-138/ai-bookmark.git
cd ai-bookmark

# 2. 用Android Studio打开项目

# 3. 等待Gradle同步完成

# 4. 点击运行按钮
```

**默认配置**：
- API地址：`https://ai-bookmark-production.up.railway.app/`
- 测试账号：`test` / `test123`

---

## 🔧 本地开发配置

如果需要连接本地后端进行开发，修改以下文件：

### 1. 修改NetworkModule.kt

文件位置：`app/src/main/java/com/example/aicollector/di/NetworkModule.kt`

```kotlin
object NetworkModule {
    private const val MOCK_API = false
    
    // 根据你的开发环境选择：
    
    // 选项1：使用Android模拟器
    private const val BASE_URL = "http://10.0.2.2:8000/"
    
    // 选项2：使用真机（替换为你的电脑IP）
    // private const val BASE_URL = "http://192.168.x.x:8000/"
    
    // 选项3：使用Railway生产环境（默认）
    // private const val BASE_URL = "https://ai-bookmark-production.up.railway.app/"
    
    private const val TIMEOUT_SECONDS = 30L
}
```

### 2. 启动本地后端

```bash
# 在项目根目录
cd ai-bookmark

# 激活虚拟环境（如果有）
.venv\Scripts\activate

# 启动后端服务
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. 验证连接

在浏览器打开：http://localhost:8000/docs

---

## 📱 不同环境的配置

### Android模拟器
```kotlin
private const val BASE_URL = "http://10.0.2.2:8000/"
```
- `10.0.2.2` 是模拟器访问宿主机的特殊地址
- 后端必须在你的电脑上运行

### Android真机
```kotlin
private const val BASE_URL = "http://192.168.8.107:8000/"
```
- 替换为你电脑的局域网IP地址
- 手机和电脑必须在同一WiFi
- 后端启动时必须用 `--host 0.0.0.0`

**获取电脑IP地址**：
```bash
# Windows
ipconfig
# 查找 "无线局域网适配器 WLAN" 下的 IPv4 地址
```

### Railway生产环境（默认）
```kotlin
private const val BASE_URL = "https://ai-bookmark-production.up.railway.app/"
```
- 无需本地后端
- 模拟器和真机都能访问
- 适合演示和测试

---

## 🧪 Mock模式（无需后端）

如果只想测试UI，不需要真实后端：

```kotlin
private const val MOCK_API = true  // 改为 true
private const val BASE_URL = "http://10.0.2.2:8000/"  // 任意值
```

Mock模式会返回预设的测试数据，适合：
- UI开发和调试
- 无网络环境测试
- 快速原型演示

---

## 🔍 常见问题

### 1. 连接超时 (SocketTimeoutException)

**问题**：应用无法连接到后端

**解决方案**：
1. 确认后端正在运行（访问 http://localhost:8000/docs）
2. 检查BASE_URL配置是否正确
3. 模拟器用 `10.0.2.2`，真机用实际IP
4. 真机测试时检查防火墙设置

### 2. 401 Unauthorized

**问题**：登录失败

**解决方案**：
- 使用测试账号：`test` / `test123`
- 确认后端API正常工作

### 3. 网络安全配置错误

**问题**：HTTPS连接失败

**解决方案**：
- Railway使用HTTPS，无需额外配置
- 本地开发使用HTTP，已在 `network_security_config.xml` 中配置

---

## 📦 依赖说明

项目使用的主要依赖：

```kotlin
// Networking
implementation("com.squareup.retrofit2:retrofit:2.9.0")
implementation("com.squareup.okhttp3:okhttp:4.11.0")

// Dependency Injection
implementation("com.google.dagger:hilt-android:2.48")

// Database
implementation("androidx.room:room-runtime:2.6.0")

// Image Loading
implementation("io.coil-kt:coil-compose:2.4.0")

// Compose
implementation("androidx.compose.ui:ui:1.5.4")
```

所有依赖会在Gradle同步时自动下载。

---

## 🎯 推荐的开发流程

### 初次开发
1. 使用Railway生产环境（默认配置）
2. 熟悉应用功能和API
3. 测试基本流程

### 功能开发
1. 切换到本地后端
2. 修改BASE_URL为 `10.0.2.2:8000`（模拟器）
3. 启动本地后端服务
4. 开发和调试新功能

### 测试和演示
1. 切换回Railway生产环境
2. 在真机上测试
3. 验证完整流程

---

## 📝 配置文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| 网络配置 | `app/src/main/java/com/example/aicollector/di/NetworkModule.kt` | API地址和超时设置 |
| 网络安全 | `app/src/main/res/xml/network_security_config.xml` | HTTP/HTTPS配置 |
| Gradle配置 | `app/build.gradle.kts` | 依赖和构建配置 |
| Manifest | `app/src/main/AndroidManifest.xml` | 权限和组件配置 |

---

## 🚀 部署到生产环境

### 修改为生产配置

1. 确保BASE_URL指向Railway
2. 关闭调试日志
3. 启用代码混淆

```kotlin
// NetworkModule.kt
private const val BASE_URL = "https://ai-bookmark-production.up.railway.app/"

// build.gradle.kts
buildTypes {
    release {
        isMinifyEnabled = true
        proguardFiles(...)
    }
}
```

### 生成Release APK

```bash
# 在Android Studio中
Build → Generate Signed Bundle / APK
```

---

## 📞 技术支持

遇到问题？

1. 查看 `网络连接问题解决方案.md`
2. 查看 `Android前端测试计划.md`
3. 查看后端API文档：https://ai-bookmark-production.up.railway.app/docs

---

**最后更新**: 2026-03-01  
**版本**: v1.0  
**状态**: ✅ 开箱即用（默认Railway生产环境）
