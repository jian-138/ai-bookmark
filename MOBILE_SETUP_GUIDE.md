# 移动端配置指南

## 🚀 快速开始

### 1. 获取Railway部署URL

Railway部署成功后,你会获得一个类似这样的URL:
```
https://your-app-name.up.railway.app
```

### 2. 配置Android应用

打开文件: `app/src/main/java/com/example/aicollector/di/NetworkModule.kt`

找到第22行:
```kotlin
private const val BASE_URL = "https://api.example.com"
```

替换为你的Railway URL:
```kotlin
private const val BASE_URL = "https://your-app-name.up.railway.app"
```

### 3. 重新构建应用

```bash
cd f:\ai-bookmark
./gradlew clean
./gradlew assembleDebug
```

或在Android Studio中:
- Build → Clean Project
- Build → Rebuild Project

### 4. 安装到设备

```bash
./gradlew installDebug
```

## 📡 已添加的API接口

后端现已支持以下移动端API:

### 用户认证
- `POST /api/v1/auth/login` - 用户登录
  - 测试账号: `test` / `test123`

### 收藏管理
- `POST /api/v1/collect` - 提交收藏
- `GET /api/v1/collect/{collect_id}` - 查询单条收藏
- `GET /api/v1/collections` - 获取收藏列表
- `GET /api/v1/collections/search` - 搜索收藏
- `DELETE /api/v1/collections/{collect_id}` - 删除收藏

### AI分析
- `POST /analyze` - 本地测试接口(固定返回)
- `POST /internal/ai/analyze` - AI分析接口(连接SiliconFlow)

## 🧪 测试连接

### 方法1: 使用浏览器测试
访问你的Railway URL根路径:
```
https://your-app-name.up.railway.app/
```

应该看到:
```json
{"message": "AI 收藏夹服务运行中"}
```

### 方法2: 使用curl测试登录
```bash
curl -X POST https://your-app-name.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
```

应该返回:
```json
{
  "success": true,
  "token": "test_token_...",
  "user_id": "usr_...",
  "message": "登录成功"
}
```

### 方法3: 测试提交收藏
```bash
curl -X POST https://your-app-name.up.railway.app/api/v1/collect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{
    "user_id": "usr_test",
    "original_text": "这是一段测试文本，长度超过10个字符",
    "url": "https://example.com"
  }'
```

## ⚙️ 配置说明

### CORS配置
后端已配置CORS,允许所有来源访问(开发环境):
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**生产环境建议**: 限制`allow_origins`为具体的移动端域名

### 环境变量
如需配置SiliconFlow API,在Railway中设置环境变量:
- `SILICONFLOW_API_KEY` - SiliconFlow API密钥

## 📱 移动端功能

### 当前已实现
- ✅ 用户登录界面
- ✅ 收藏列表显示
- ✅ 文本选择和收藏
- ✅ 浮窗按钮
- ✅ 离线队列支持
- ✅ 本地缓存

### 测试流程
1. 启动Android应用
2. 使用测试账号登录 (`test` / `test123`)
3. 选择任意文本
4. 点击浮窗按钮收藏
5. 在收藏列表中查看

## 🔧 故障排查

### 问题1: 无法连接到服务器
**检查项**:
- ✅ Railway服务是否正常运行
- ✅ BASE_URL是否正确配置
- ✅ 网络连接是否正常
- ✅ 防火墙是否阻止连接

### 问题2: 401 Unauthorized
**解决方案**:
- 确保正确传递Authorization header
- 检查token格式: `Bearer <token>`

### 问题3: 400 Bad Request
**检查项**:
- 文本长度 ≥ 10个字符
- JSON格式正确
- 必填字段都已提供

## 📝 开发建议

### 使用BuildConfig管理环境
在`app/build.gradle.kts`中:
```kotlin
buildTypes {
    debug {
        buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:8000\"")
    }
    release {
        buildConfigField("String", "API_BASE_URL", "\"https://your-app.up.railway.app\"")
    }
}
```

在`NetworkModule.kt`中:
```kotlin
private const val BASE_URL = BuildConfig.API_BASE_URL
```

## 🎯 下一步

1. ✅ 后端API已部署到Railway
2. ⏳ 配置Android应用连接Railway
3. ⏳ 测试登录功能
4. ⏳ 测试收藏功能
5. ⏳ 添加真实数据库支持
6. ⏳ 集成真实用户认证系统

---

**需要帮助?**
- 查看 `docs/INTEGRATION_TESTING_CHECKLIST.md`
- 查看 `docs/BACKEND_CONFIGURATION.md`
- 查看 `docs/api-contract-v1.1.md`
