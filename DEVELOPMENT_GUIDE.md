# AI收藏夹 Android 开发指南

## 已完成的工作

### ✅ 1. 项目结构和依赖配置
- 配置了所有必需的Gradle依赖（Hilt, Compose, Retrofit, Room, Kotest等）
- 设置了ProGuard规则
- 配置了网络安全（HTTPS强制）
- 创建了Application类和基础目录结构

### ✅ 2. 数据模型和数据库层
- **域模型**: `CollectionItem`
- **数据传输对象**: `CollectionRequest`, `CollectionResponse`, `LoginRequest`, `LoginResponse`
- **Room实体**: `CollectionEntity`, `PendingCollectionEntity`
- **DAO接口**: `CollectionDao`, `PendingCollectionDao`
- **数据库**: `AppDatabase`
- **数据映射器**: `CollectionMapper`
- **属性测试**: 数据模型映射的往返一致性测试

### ✅ 3. 网络层
- **API服务**: `ApiService` - 定义了所有REST端点
- **认证拦截器**: `AuthInterceptor` - 自动添加Bearer token
- **Token管理**: `TokenManager` - 使用EncryptedSharedPreferences安全存储
- **网络工具**: `NetworkHelper`, `NetworkResult` - 错误处理和结果封装
- **Hilt模块**: `NetworkModule` - 提供Retrofit和OkHttp实例
- **属性测试**: 
  - 网络请求认证测试
  - HTTPS协议使用测试

### ✅ 4. 安全和加密层
- **加密工具**: `EncryptionUtil` - 使用Android Keystore的AES-256-GCM加密
- **安全日志**: `SecureLogger` - 自动过滤敏感信息（token, password等）
- **属性测试**:
  - 数据加密往返测试
  - 凭证日志防护测试

## 项目架构

```
app/src/main/java/com/example/aicollector/
├── data/
│   ├── local/
│   │   ├── entity/          # Room实体
│   │   ├── dao/             # DAO接口
│   │   └── AppDatabase.kt   # Room数据库
│   ├── remote/
│   │   ├── ApiService.kt    # Retrofit API接口
│   │   └── AuthInterceptor.kt
│   ├── model/               # 数据传输对象
│   ├── mapper/              # 数据映射器
│   └── repository/          # 仓库实现（待实现）
├── domain/
│   ├── model/               # 域模型
│   ├── repository/          # 仓库接口（待实现）
│   └── usecase/             # 用例（待实现）
├── presentation/
│   ├── ui/                  # Compose UI屏幕（待实现）
│   └── viewmodel/           # ViewModels（待实现）
├── service/                 # 后台服务（待实现）
├── di/                      # Hilt模块
│   ├── DatabaseModule.kt
│   └── NetworkModule.kt
└── util/                    # 工具类
    ├── TokenManager.kt
    ├── EncryptionUtil.kt
    ├── SecureLogger.kt
    ├── NetworkHelper.kt
    └── NetworkResult.kt
```

## 下一步实现指南

### 任务5: 离线队列和缓存机制

创建以下文件：

1. **PendingCollectionQueue.kt** - 管理离线队列
```kotlin
class PendingCollectionQueue @Inject constructor(
    private val pendingDao: PendingCollectionDao,
    private val apiService: ApiService
) {
    suspend fun enqueue(text: String, source: String?)
    suspend fun syncPending()
}
```

2. **CacheManager.kt** - 管理缓存大小
```kotlin
class CacheManager @Inject constructor(
    private val collectionDao: CollectionDao
) {
    suspend fun checkCacheSize()
    suspend fun clearOldCache()
}
```

3. **SyncWorker.kt** - WorkManager后台同步
```kotlin
class SyncWorker @Inject constructor(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params)
```

### 任务6: 认证仓库和用例

1. **AuthRepository.kt** (接口)
```kotlin
interface AuthRepository {
    suspend fun login(username: String, password: String): NetworkResult<LoginResponse>
    suspend fun logout()
    fun isAuthenticated(): Boolean
}
```

2. **AuthRepositoryImpl.kt**
```kotlin
class AuthRepositoryImpl @Inject constructor(
    private val apiService: ApiService,
    private val tokenManager: TokenManager
) : AuthRepository
```

3. **LoginUseCase.kt**, **LogoutUseCase.kt**

### 任务7: 收藏仓库和用例

1. **CollectionRepository.kt** (接口)
```kotlin
interface CollectionRepository {
    suspend fun submitCollection(text: String): Result<CollectionItem>
    suspend fun getCollections(page: Int): Result<List<CollectionItem>>
    suspend fun searchCollections(query: String, category: String?): Result<List<CollectionItem>>
    suspend fun deleteCollection(id: String): Result<Unit>
}
```

2. **CollectionRepositoryImpl.kt**
3. **SubmitCollectionUseCase.kt**, **GetCollectionsUseCase.kt**等

### 任务8-9: 后台服务

1. **CollectorForegroundService.kt**
```kotlin
class CollectorForegroundService : Service() {
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, createNotification())
        return START_STICKY
    }
}
```

2. **OverlayService.kt** - 浮窗服务
3. **TextCaptureManager.kt** - 文本捕获
4. **BootReceiver.kt** - 开机自启动

### 任务10-14: UI层（Compose）

1. **LoginScreen.kt**
```kotlin
@Composable
fun LoginScreen(
    viewModel: LoginViewModel = hiltViewModel(),
    onLoginSuccess: () -> Unit
)
```

2. **CollectionListScreen.kt**
3. **CollectionDetailScreen.kt**
4. **各个ViewModel**

### 任务15-18: UI增强

1. **NotificationManager** - 通知系统
2. **Theme.kt** - Material 3主题
3. **LoadingIndicator.kt**, **ErrorMessage.kt** - 可复用组件

### 任务19-21: 导航和权限

1. **NavGraph.kt** - Navigation Compose
2. **PermissionHandler.kt** - 权限请求

### 任务22-28: 测试和发布

1. 编写所有属性测试
2. 编写集成测试
3. 配置发布构建

## 属性测试模式

所有属性测试都遵循以下模式：

```kotlin
/**
 * Feature: ai-collector-frontend, Property X: [Property Name]
 * Validates: Requirements X.Y
 * 
 * Property: [Property description]
 */
class SomePropertyTest : StringSpec({
    "Property description" {
        checkAll(100, Arb.someGenerator()) { input ->
            // Test logic
            result shouldBe expected
        }
    }
})
```

## 运行项目

1. 确保安装了JDK 11+
2. 打开Android Studio
3. 同步Gradle: `./gradlew build`
4. 运行应用: 选择设备并点击Run

## 测试

```bash
# 运行单元测试
./gradlew test

# 运行Android测试
./gradlew connectedAndroidTest

# 运行特定测试
./gradlew test --tests "*.property.*"
```

## 注意事项

1. **API URL**: 在`NetworkModule.kt`中更新`BASE_URL`为实际的后端API地址
2. **权限**: 确保在AndroidManifest.xml中声明所有必需权限
3. **ProGuard**: 发布前测试ProGuard规则
4. **安全**: 永远不要在代码中硬编码API密钥或敏感信息

## 参考资源

- [Android开发文档](https://developer.android.com/)
- [Jetpack Compose](https://developer.android.com/jetpack/compose)
- [Hilt依赖注入](https://developer.android.com/training/dependency-injection/hilt-android)
- [Room数据库](https://developer.android.com/training/data-storage/room)
- [Retrofit](https://square.github.io/retrofit/)
- [Kotest](https://kotest.io/)
