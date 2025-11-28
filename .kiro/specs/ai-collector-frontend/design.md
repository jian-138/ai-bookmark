# Design Document - AI Collector Frontend

## Overview

AI收藏夹Android应用采用现代Android开发架构，使用Kotlin作为主要开发语言，遵循MVVM (Model-View-ViewModel) 架构模式。应用由三个核心模块组成：后台服务模块（负责保活和文本捕获）、UI模块（负责用户交互和展示）、以及网络模块（负责与后端API通信）。

应用使用Jetpack Compose构建现代化UI界面，使用Room数据库进行本地数据持久化，使用Retrofit进行网络请求，使用Hilt进行依赖注入。

## Architecture

### 整体架构

应用采用分层架构设计：

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Compose UI + ViewModels)              │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         Domain Layer                    │
│  (Use Cases + Business Logic)           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         Data Layer                      │
│  (Repositories + Data Sources)          │
└─────────────────────────────────────────┘
              ↓
┌──────────────────┬──────────────────────┐
│  Local Storage   │   Remote API         │
│  (Room DB)       │   (Retrofit)         │
└──────────────────┴──────────────────────┘
```

### 核心模块

1. **Service Module (后台服务模块)**
   - CollectorForegroundService: 前台服务，保持应用在后台运行
   - OverlayService: 浮窗服务，提供文本选择功能
   - TextCaptureManager: 文本捕获管理器

2. **UI Module (界面模块)**
   - MainActivity: 主活动
   - CollectionListScreen: 收藏列表界面
   - CollectionDetailScreen: 收藏详情界面
   - LoginScreen: 登录界面
   - SettingsScreen: 设置界面

3. **Network Module (网络模块)**
   - ApiService: API接口定义
   - NetworkRepository: 网络数据仓库
   - AuthInterceptor: 认证拦截器

4. **Data Module (数据模块)**
   - CollectionRepository: 收藏数据仓库
   - LocalDatabase: Room数据库
   - CacheManager: 缓存管理器

## Components and Interfaces

### 1. 后台服务组件

#### CollectorForegroundService
```kotlin
class CollectorForegroundService : Service() {
    // 前台服务，显示持久通知
    // 监听系统事件，确保服务存活
    // 管理OverlayService的生命周期
}
```

#### OverlayService
```kotlin
class OverlayService : Service() {
    // 创建和管理浮窗视图
    // 处理文本选择逻辑
    // 与TextCaptureManager交互
}
```

#### TextCaptureManager
```kotlin
interface TextCaptureManager {
    fun captureSelectedText(): String
    fun isAccessibilityServiceEnabled(): Boolean
    fun requestAccessibilityPermission()
}
```

### 2. UI组件

#### CollectionListViewModel
```kotlin
class CollectionListViewModel : ViewModel() {
    val collections: StateFlow<List<CollectionItem>>
    val isLoading: StateFlow<Boolean>
    val error: StateFlow<String?>
    
    fun loadCollections()
    fun searchCollections(query: String)
    fun filterByCategory(category: String)
    fun deleteCollection(id: String)
}
```

#### LoginViewModel
```kotlin
class LoginViewModel : ViewModel() {
    val loginState: StateFlow<LoginState>
    
    fun login(username: String, password: String)
    fun logout()
    fun isAuthenticated(): Boolean
}
```

### 3. 网络接口

#### ApiService
```kotlin
interface ApiService {
    @POST("/api/collect")
    suspend fun submitCollection(
        @Body request: CollectionRequest
    ): Response<CollectionResponse>
    
    @GET("/api/collections")
    suspend fun getCollections(
        @Query("page") page: Int,
        @Query("size") size: Int
    ): Response<CollectionListResponse>
    
    @GET("/api/collections/search")
    suspend fun searchCollections(
        @Query("query") query: String,
        @Query("category") category: String?
    ): Response<CollectionListResponse>
    
    @DELETE("/api/collections/{id}")
    suspend fun deleteCollection(
        @Path("id") id: String
    ): Response<Unit>
    
    @POST("/api/auth/login")
    suspend fun login(
        @Body credentials: LoginRequest
    ): Response<LoginResponse>
}
```

### 4. 数据仓库

#### CollectionRepository
```kotlin
interface CollectionRepository {
    suspend fun submitCollection(text: String): Result<CollectionItem>
    suspend fun getCollections(page: Int): Result<List<CollectionItem>>
    suspend fun searchCollections(query: String, category: String?): Result<List<CollectionItem>>
    suspend fun deleteCollection(id: String): Result<Unit>
    suspend fun getCachedCollections(): List<CollectionItem>
    suspend fun cacheCollections(items: List<CollectionItem>)
}
```

## Data Models

### CollectionItem
```kotlin
data class CollectionItem(
    val id: String,
    val originalText: String,
    val keywords: List<String>,
    val category: String,
    val timestamp: Long,
    val userId: String
)
```

### CollectionRequest
```kotlin
data class CollectionRequest(
    val text: String,
    val source: String?,
    val timestamp: Long
)
```

### CollectionResponse
```kotlin
data class CollectionResponse(
    val id: String,
    val keywords: List<String>,
    val category: String,
    val success: Boolean,
    val message: String?
)
```

### LoginRequest
```kotlin
data class LoginRequest(
    val username: String,
    val password: String
)
```

### LoginResponse
```kotlin
data class LoginResponse(
    val token: String,
    val userId: String,
    val expiresIn: Long
)
```

### Room Database Entities
```kotlin
@Entity(tableName = "collections")
data class CollectionEntity(
    @PrimaryKey val id: String,
    val originalText: String,
    val keywords: String, // JSON array stored as string
    val category: String,
    val timestamp: Long,
    val userId: String,
    val synced: Boolean
)

@Entity(tableName = "pending_collections")
data class PendingCollectionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val text: String,
    val source: String?,
    val timestamp: Long,
    val retryCount: Int
)
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing all testable properties from the prework analysis, I've identified several areas where properties can be consolidated:

- Properties related to service lifecycle (1.1, 1.3, 1.5) can be combined into a comprehensive service state property
- Properties related to network requests (3.1, 3.5) can be combined into a single request validation property
- Properties related to UI display of collection items (4.2, 4.4) can be combined
- Properties related to authentication state (6.1, 6.2, 6.5) overlap and can be streamlined

The following properties represent the unique, non-redundant validation requirements:

Property 1: Service lifecycle consistency
*For any* app launch or device restart, when the app is started, the foreground service should be running and a notification should be displayed
**Validates: Requirements 1.1, 1.3, 1.5**

Property 2: Permission-based UI availability
*For any* permission state change, when overlay permission is granted, the floating button should become visible on screen
**Validates: Requirements 1.4, 2.1**

Property 3: Text selection activation
*For any* floating button tap event, the system should transition to text selection mode
**Validates: Requirements 2.2**

Property 4: Text capture and confirmation
*For any* non-empty text selection, the system should capture the text and display a confirmation action
**Validates: Requirements 2.4**

Property 5: Whitespace input rejection
*For any* string composed entirely of whitespace characters, attempting to collect it should be rejected and an error message should be displayed
**Validates: Requirements 2.5**

Property 6: Network request completeness
*For any* confirmed text collection, the system should send a POST request to the backend API that includes the text content and authentication token in the header
**Validates: Requirements 3.1, 3.5**

Property 7: Offline queueing
*For any* collection attempt when network is unavailable, the text should be stored in a local queue and sent when connection is restored
**Validates: Requirements 3.2**

Property 8: Response notification mapping
*For any* backend API response, the system should display a success notification for successful responses and an error message with retry option for error responses
**Validates: Requirements 3.3, 3.4**

Property 9: Collection list data fetching
*For any* navigation to the collection list screen, the system should fetch collection items from the backend API
**Validates: Requirements 4.1**

Property 10: Collection item completeness
*For any* collection item displayed in the list, the rendered view should contain the original text, keywords, category, and timestamp
**Validates: Requirements 4.2**

Property 11: Pagination trigger
*For any* scroll event that reaches the bottom of the collection list, the system should load the next page of items
**Validates: Requirements 4.3**

Property 12: Detail navigation
*For any* collection item tap, the system should navigate to a detail screen showing the complete text and AI analysis results
**Validates: Requirements 4.4**

Property 13: Search request transmission
*For any* search query entered by the user, the system should send the query to the backend API and display the returned results
**Validates: Requirements 5.1**

Property 14: Category filter accuracy
*For any* category filter selection, all displayed collection items should belong to the selected category
**Validates: Requirements 5.2**

Property 15: Filter combination logic
*For any* combination of multiple filters, the results should satisfy all filter criteria (AND logic)
**Validates: Requirements 5.3**

Property 16: Keyword highlighting
*For any* search result item, the displayed text should highlight occurrences of the search keywords
**Validates: Requirements 5.4**

Property 17: Unauthenticated initial state
*For any* first app launch without stored credentials, the system should display the login screen
**Validates: Requirements 6.1**

Property 18: Authentication token storage
*For any* successful login with valid credentials, the system should store the authentication token securely
**Validates: Requirements 6.2**

Property 19: Token expiration handling
*For any* API request with an expired token, the system should prompt the user to re-authenticate
**Validates: Requirements 6.3**

Property 20: Logout data clearing
*For any* logout action, the system should clear the stored authentication token and local cache
**Validates: Requirements 6.4**

Property 21: User association
*For any* collection item created while authenticated, the item should be associated with the current user's account
**Validates: Requirements 6.5**

Property 22: Loading indicator display
*For any* long-running operation, the system should display a loading indicator during processing
**Validates: Requirements 7.3**

Property 23: Error message display
*For any* error condition, the system should display an error message to the user
**Validates: Requirements 7.4**

Property 24: Theme adaptation
*For any* system theme change between light and dark mode, the UI should adapt to the new theme
**Validates: Requirements 7.5**

Property 25: Background memory reduction
*For any* transition to background state, the application's memory footprint should decrease compared to foreground state
**Validates: Requirements 8.2**

Property 26: Cache size limits
*For any* cached data, the total cache size should not exceed the configured maximum limit
**Validates: Requirements 8.4**

Property 27: Low battery adaptation
*For any* device state change to low battery mode, the system should reduce background activity frequency
**Validates: Requirements 8.5**

Property 28: HTTPS protocol usage
*For any* network request to the backend API, the request should use HTTPS protocol
**Validates: Requirements 9.1**

Property 29: Data encryption
*For any* sensitive data cached locally, the data should be encrypted using AES encryption
**Validates: Requirements 9.3**

Property 30: Credential logging prevention
*For any* log entry, the log should not contain user credentials or authentication tokens in plain text
**Validates: Requirements 9.5**

Property 31: Long press action menu
*For any* long press on a collection item, the system should display an action menu including a delete option
**Validates: Requirements 10.1**

Property 32: Deletion API call
*For any* confirmed deletion action, the system should send a DELETE request to the backend API
**Validates: Requirements 10.2**

Property 33: Successful deletion UI update
*For any* successful deletion response, the system should remove the item from the display and show a confirmation message
**Validates: Requirements 10.3**

Property 34: Failed deletion handling
*For any* failed deletion response, the system should display an error message and keep the item in the list
**Validates: Requirements 10.4**

Property 35: Undo availability
*For any* deletion action, the system should provide an undo option within a short time window
**Validates: Requirements 10.5**

## Error Handling

### Network Errors

1. **Connection Timeout**: Display user-friendly message and provide retry option. Queue data locally if it's a collection submission.

2. **Server Errors (5xx)**: Show error message indicating server issues. Implement exponential backoff for retries.

3. **Client Errors (4xx)**: 
   - 401 Unauthorized: Clear token and redirect to login
   - 403 Forbidden: Show permission denied message
   - 404 Not Found: Show resource not found message
   - 400 Bad Request: Show validation error details

4. **Network Unavailable**: Automatically queue operations and sync when connection is restored. Show offline indicator in UI.

### Data Errors

1. **Invalid Response Format**: Log error details and show generic error message to user. Don't crash the app.

2. **Database Errors**: Catch SQLite exceptions, log them, and provide fallback behavior (e.g., skip caching).

3. **Encryption Errors**: If encryption fails, log error but don't store sensitive data unencrypted. Prompt user to re-authenticate.

### Service Errors

1. **Service Killed by System**: Implement service restart logic using START_STICKY flag and AlarmManager for periodic checks.

2. **Permission Denied**: Show clear explanation of why permission is needed and guide user to settings.

3. **Accessibility Service Disabled**: Detect when service is disabled and prompt user to re-enable with instructions.

### UI Errors

1. **Compose Rendering Errors**: Wrap composables in error boundaries to prevent full app crashes.

2. **Navigation Errors**: Validate navigation arguments and handle missing/invalid data gracefully.

3. **Resource Loading Errors**: Provide fallback resources and handle missing assets.

## Testing Strategy

### Unit Testing

The application will use JUnit 4 and MockK for unit testing. Unit tests will focus on:

1. **ViewModel Logic**: Test state management, data transformation, and business logic in ViewModels
   - Test login flow state transitions
   - Test collection list filtering and search logic
   - Test error state handling

2. **Repository Layer**: Test data source coordination and caching logic
   - Test offline queueing mechanism
   - Test cache invalidation logic
   - Test data synchronization

3. **Use Cases**: Test individual business operations
   - Test text validation logic
   - Test authentication token management
   - Test collection submission workflow

4. **Data Mappers**: Test conversion between entity types
   - Test Room entity to domain model mapping
   - Test API response to domain model mapping

5. **Utility Classes**: Test helper functions and extensions
   - Test text processing utilities
   - Test encryption/decryption functions
   - Test date formatting utilities

### Property-Based Testing

The application will use Kotest Property Testing library for property-based tests. Each property-based test will run a minimum of 100 iterations with randomly generated inputs.

**Property-based test requirements**:
- Each test must be tagged with a comment in this format: `**Feature: ai-collector-frontend, Property {number}: {property_text}**`
- Each correctness property from the design document must be implemented by a single property-based test
- Tests should use smart generators that constrain inputs to valid ranges

**Property test coverage**:

1. **Text Validation Properties** (Property 5)
   - Generate various whitespace-only strings (spaces, tabs, newlines, mixed)
   - Verify all are rejected

2. **Network Request Properties** (Property 6, 28)
   - Generate random text content
   - Verify all requests include auth token and use HTTPS

3. **Offline Queue Properties** (Property 7)
   - Generate random network states and collection attempts
   - Verify items are queued when offline and sent when online

4. **Filter Logic Properties** (Property 14, 15)
   - Generate random collections with various categories
   - Generate random filter combinations
   - Verify filtered results match all criteria

5. **Authentication Properties** (Property 18, 19, 20)
   - Generate random login scenarios
   - Verify token storage, expiration handling, and logout clearing

6. **Cache Properties** (Property 26)
   - Generate random amounts of cached data
   - Verify cache size never exceeds limit

7. **Encryption Properties** (Property 29)
   - Generate random sensitive data
   - Verify all cached sensitive data is encrypted

8. **Deletion Properties** (Property 32, 33, 34)
   - Generate random deletion scenarios with success/failure responses
   - Verify correct API calls and UI updates

### Integration Testing

Integration tests will use Android Instrumentation Testing with Espresso and Hilt for dependency injection:

1. **Service Integration**: Test foreground service lifecycle and notification display

2. **Database Integration**: Test Room database operations with real SQLite database

3. **Network Integration**: Test API calls with MockWebServer

4. **UI Integration**: Test complete user flows with Compose UI Testing
   - Login → Collection List → Detail flow
   - Text selection → Collection submission flow
   - Search and filter flow

### UI Testing

UI tests will use Compose Testing library:

1. **Screen Navigation**: Test navigation between screens

2. **User Interactions**: Test button clicks, text input, scrolling

3. **State Display**: Test that UI correctly reflects ViewModel state

4. **Error States**: Test error message display and retry actions

### Test Organization

```
app/src/test/java/
├── viewmodel/
│   ├── CollectionListViewModelTest.kt
│   ├── LoginViewModelTest.kt
│   └── ...
├── repository/
│   ├── CollectionRepositoryTest.kt
│   └── ...
├── usecase/
│   └── ...
├── util/
│   └── ...
└── property/
    ├── TextValidationPropertyTest.kt
    ├── NetworkRequestPropertyTest.kt
    ├── OfflineQueuePropertyTest.kt
    ├── FilterLogicPropertyTest.kt
    ├── AuthenticationPropertyTest.kt
    ├── CachePropertyTest.kt
    ├── EncryptionPropertyTest.kt
    └── DeletionPropertyTest.kt

app/src/androidTest/java/
├── service/
│   └── CollectorServiceTest.kt
├── database/
│   └── CollectionDaoTest.kt
├── ui/
│   ├── LoginScreenTest.kt
│   ├── CollectionListScreenTest.kt
│   └── ...
└── integration/
    └── EndToEndFlowTest.kt
```

## Implementation Notes

### Android-Specific Considerations

1. **Foreground Service**: Use `startForeground()` with a notification channel to keep service alive. Target Android 12+ requires declaring foreground service type in manifest.

2. **Overlay Permission**: Request `SYSTEM_ALERT_WINDOW` permission. On Android 11+, need to handle scoped storage restrictions.

3. **Accessibility Service**: Required for capturing text from other apps. Must be explicitly enabled by user in system settings.

4. **Battery Optimization**: Request to be excluded from battery optimization using `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` permission.

5. **Background Restrictions**: Handle Doze mode and App Standby. Use WorkManager for guaranteed background execution.

### Security Considerations

1. **Token Storage**: Use Android Keystore System for storing authentication tokens. Keystore is hardware-backed on supported devices.

2. **Network Security**: Implement certificate pinning for API communication. Use Network Security Configuration.

3. **Data Encryption**: Use AES-256 for encrypting cached data. Generate encryption keys using KeyGenerator.

4. **ProGuard/R8**: Enable code obfuscation for release builds to protect against reverse engineering.

### Performance Optimization

1. **Lazy Loading**: Use Paging 3 library for efficient list loading with pagination.

2. **Image Loading**: If displaying images in future, use Coil library with memory and disk caching.

3. **Database Queries**: Use Room's Flow-based queries for reactive updates. Create appropriate indexes.

4. **Memory Management**: Use weak references for listeners. Properly cancel coroutines in ViewModels.

5. **Network Optimization**: Implement request deduplication. Use OkHttp's connection pooling and caching.

### Dependencies

```kotlin
// Core Android
implementation("androidx.core:core-ktx:1.12.0")
implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")

// Compose
implementation("androidx.activity:activity-compose:1.8.2")
implementation("androidx.compose.ui:ui:1.6.0")
implementation("androidx.compose.material3:material3:1.2.0")
implementation("androidx.navigation:navigation-compose:2.7.6")

// Coroutines
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

// Dependency Injection
implementation("com.google.dagger:hilt-android:2.50")
kapt("com.google.dagger:hilt-compiler:2.50")

// Network
implementation("com.squareup.retrofit2:retrofit:2.9.0")
implementation("com.squareup.retrofit2:converter-gson:2.9.0")
implementation("com.squareup.okhttp3:okhttp:4.12.0")
implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

// Database
implementation("androidx.room:room-runtime:2.6.1")
implementation("androidx.room:room-ktx:2.6.1")
kapt("androidx.room:room-compiler:2.6.1")

// Security
implementation("androidx.security:security-crypto:1.1.0-alpha06")

// Testing
testImplementation("junit:junit:4.13.2")
testImplementation("io.mockk:mockk:1.13.9")
testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
testImplementation("io.kotest:kotest-runner-junit5:5.8.0")
testImplementation("io.kotest:kotest-assertions-core:5.8.0")
testImplementation("io.kotest:kotest-property:5.8.0")

androidTestImplementation("androidx.test.ext:junit:1.1.5")
androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
androidTestImplementation("androidx.compose.ui:ui-test-junit4:1.6.0")
androidTestImplementation("com.squareup.okhttp3:mockwebserver:4.12.0")
```

## Future Enhancements

1. **Rich Text Support**: Support for capturing formatted text with styling information

2. **Image Capture**: Ability to capture and store images along with text

3. **Offline Mode**: Full offline functionality with background sync

4. **Widget**: Home screen widget for quick access to recent collections

5. **Share Extension**: Android share target to collect content from share menu

6. **Voice Input**: Voice-to-text for hands-free collection

7. **Tags**: User-defined tags in addition to AI-generated categories

8. **Export**: Export collections to various formats (PDF, Markdown, etc.)
