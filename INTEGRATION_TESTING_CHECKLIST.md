# 前后端联调检查清单

## 📋 联调前准备

### 1. 确认后端信息

与后端同学确认以下信息：

- [ ] **后端地址**
  - 本地开发：`http://localhost:端口` 或 `http://IP:端口`
  - 测试环境：`http://test-server:端口`
  - 生产环境：`https://your-domain.com`

- [ ] **后端端口**
  - 例如：5000, 8000, 3000 等

- [ ] **API版本路径**
  - 确认是 `/api/v1/` 还是其他

- [ ] **后端是否已启动**
  - 可以用浏览器或Postman测试：`http://后端地址/api/v1/collect`

### 2. 配置Android应用

#### 步骤1：修改后端地址

打开文件：`app/src/main/java/com/example/aicollector/di/NetworkModule.kt`

找到这一行：
```kotlin
private const val BASE_URL = "https://api.example.com"
```

**如果使用Android模拟器：**
```kotlin
private const val BASE_URL = "http://10.0.2.2:5000"  // 5000改为你的后端端口
```

**如果使用真机（手机和电脑在同一WiFi）：**
```kotlin
private const val BASE_URL = "http://192.168.1.100:5000"  // 改为你电脑的IP和端口
```

**如何查看电脑IP：**
- Windows: 打开CMD，输入 `ipconfig`，查看"IPv4 地址"
- Mac/Linux: 打开终端，输入 `ifconfig` 或 `ip addr`

#### 步骤2：确认网络安全配置

文件：`app/src/main/res/xml/network_security_config.xml`

如果使用HTTP（非HTTPS），确保包含：
```xml
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
```

#### 步骤3：重新构建应用

```bash
./gradlew clean
./gradlew assembleDebug
```

或在Android Studio中：
- Build → Clean Project
- Build → Rebuild Project

### 3. 准备测试数据

与后端确认：

- [ ] **测试用户账号**
  - 用户名：_______
  - 密码：_______
  - 或使用开发模式：test/test123

- [ ] **测试文本**
  - 准备一些测试用的文本内容（≥10字符）

## 🧪 联调测试步骤

### 测试1：网络连通性

**目标**：确认应用能连接到后端

1. 启动后端服务
2. 启动Android应用
3. 打开Android Studio的Logcat
4. 过滤关键词：`OkHttp` 或 `Retrofit`
5. 观察是否有网络请求日志

**预期结果**：
- ✅ 看到HTTP请求日志
- ✅ 请求URL正确（包含你配置的BASE_URL）
- ❌ 如果看到 "Unable to resolve host"，说明地址配置错误

### 测试2：用户登录

**目标**：测试登录接口

**测试步骤**：
1. 打开应用，进入登录界面
2. 输入测试账号或点击"使用测试账号"
3. 点击登录

**预期结果**：
- ✅ 登录成功，跳转到收藏列表页面
- ✅ Logcat显示：`POST /api/v1/auth/login` 返回200
- ✅ 收到token和userId

**可能的问题**：
- ❌ 404错误：检查后端登录接口路径是否为 `/api/v1/auth/login`
- ❌ 400错误：检查请求体格式是否正确
- ❌ 500错误：后端服务器错误，联系后端同学

### 测试3：提交收藏

**目标**：测试提交收藏接口

**测试步骤**：
1. 登录成功后
2. 选中一段文本（通过无障碍服务或手动输入）
3. 提交收藏

**预期结果**：
- ✅ 提交成功
- ✅ Logcat显示：`POST /api/v1/collect` 返回201或200
- ✅ 收到 `collect_id` 和 `created_at`
- ✅ 本地数据库保存了收藏记录

**检查请求体**：
```json
{
  "user_id": "usr_xxx",
  "original_text": "测试文本内容",
  "url": "https://example.com"
}
```

**检查响应体**：
```json
{
  "success": true,
  "collect_id": "col_xxx",
  "created_at": "2025-04-05T10:00:00Z",
  "message": "收藏成功，已提交 AI 分析"
}
```

**可能的问题**：
- ❌ 400 TEXT_TOO_SHORT：文本少于10字符
- ❌ 404 USER_NOT_FOUND：user_id不存在
- ❌ 401 Unauthorized：token无效或过期

### 测试4：查询收藏列表

**目标**：测试获取收藏列表接口

**测试步骤**：
1. 提交几条收藏后
2. 下拉刷新收藏列表
3. 或重启应用

**预期结果**：
- ✅ 显示收藏列表
- ✅ Logcat显示：`GET /api/v1/collections?page=0&size=20` 返回200
- ✅ 列表显示正确的文本和AI分析结果

**可能的问题**：
- ❌ 空列表：检查user_id是否正确
- ❌ 404错误：检查接口路径

### 测试5：查询单条收藏详情

**目标**：测试查询收藏详情接口

**测试步骤**：
1. 点击列表中的某条收藏
2. 查看详情

**预期结果**：
- ✅ Logcat显示：`GET /api/v1/collect/{collect_id}` 返回200
- ✅ 返回完整的收藏信息，包括AI分析结果

**检查响应体**：
```json
{
  "success": true,
  "data": {
    "collect_id": "col_xxx",
    "user_id": "usr_xxx",
    "original_text": "...",
    "url": "...",
    "ai_keywords": ["关键词1", "关键词2"],
    "ai_category": "科技,教育",
    "summary": "AI生成的摘要",
    "ai_confidence": 0.91,
    "status": "ANALYZED",
    "created_at": "2025-04-05T10:00:00Z",
    "updated_at": "2025-04-05T10:00:05Z"
  }
}
```

## 🔍 调试技巧

### 1. 查看网络请求日志

在Logcat中过滤：
```
OkHttp
```

你会看到：
- 请求URL
- 请求头（包括Authorization）
- 请求体
- 响应码
- 响应体

### 2. 使用Charles或Fiddler抓包

如果需要更详细的网络分析：
1. 安装Charles Proxy或Fiddler
2. 配置手机代理
3. 查看所有HTTP/HTTPS请求

### 3. 检查Token

在Logcat中搜索：
```
Authorization: Bearer
```

确认token是否正确携带在请求头中。

### 4. 后端日志

与后端同学配合，同时查看：
- Android应用的请求日志
- 后端服务器的接收日志
- 对比请求是否到达后端

## ⚠️ 常见问题排查

### 问题1：无法连接到后端

**症状**：`Unable to resolve host` 或 `Connection refused`

**排查步骤**：
1. 确认后端服务已启动
2. 确认BASE_URL配置正确
3. 模拟器使用 `10.0.2.2`，真机使用电脑IP
4. 检查防火墙是否阻止了端口
5. 确认手机和电脑在同一网络（真机）

### 问题2：401 Unauthorized

**症状**：登录后的请求返回401

**排查步骤**：
1. 检查token是否正确保存
2. 检查AuthInterceptor是否正确添加token
3. 检查token格式：`Authorization: Bearer <token>`
4. 检查token是否过期

### 问题3：数据格式不匹配

**症状**：400 Bad Request 或解析错误

**排查步骤**：
1. 对比API文档和实际请求体
2. 检查字段名是否使用了 `@SerializedName`
3. 检查日期格式是否为ISO 8601
4. 使用Postman测试后端接口

### 问题4：HTTPS证书错误

**症状**：`SSL handshake failed`

**解决方案**：
- 开发环境使用HTTP
- 或在network_security_config.xml中配置信任的证书

## ✅ 联调完成检查

确认以下功能都正常：

- [ ] 登录成功
- [ ] 提交收藏成功
- [ ] 查看收藏列表
- [ ] 查看收藏详情
- [ ] AI分析结果正确显示
- [ ] 离线缓存工作正常
- [ ] 网络错误处理正确
- [ ] Token自动刷新（如果实现）

## 📝 联调记录模板

```
联调日期：2025-XX-XX
后端地址：http://xxx:xxx
测试账号：xxx/xxx

测试结果：
✅ 登录接口 - 正常
✅ 提交收藏 - 正常
✅ 查询列表 - 正常
✅ 查询详情 - 正常

发现问题：
1. xxx
2. xxx

待解决：
1. xxx
2. xxx
```

## 🎯 下一步

联调成功后：
1. 测试更多边界情况
2. 测试网络异常情况
3. 测试并发请求
4. 性能测试
5. 准备上线

---

**需要帮助？**
- 查看 `API_ALIGNMENT_CHANGES.md` 了解API变更
- 查看 `api-contract-v1.1.md` 了解接口规范
- 查看 `BACKEND_CONFIGURATION.md` 了解配置详情
