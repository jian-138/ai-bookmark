# Design Document - Development Mode Login

## Overview

This feature adds a development mode to the AI Collector app that allows developers to quickly test the application using predefined test credentials. The mode is only available in debug builds and integrates seamlessly with the existing authentication system.

## Architecture

The development mode will be implemented using:

1. **Build Configuration**: Use Android BuildConfig to define a compile-time constant that indicates whether dev mode is enabled
2. **Repository Pattern Extension**: Extend AuthRepositoryImpl to check for test credentials before making network calls
3. **UI Enhancement**: Add conditional UI elements to LoginScreen that appear only in dev mode
4. **Mock Token Generation**: Generate deterministic mock tokens for test accounts

### Component Interaction

```
LoginScreen (UI Layer)
    ↓ (shows dev mode button if enabled)
    ↓ (user clicks login with test credentials)
LoginViewModel
    ↓ (calls login)
AuthRepositoryImpl
    ↓ (checks if credentials match test account)
    ├─→ [Test Account] Generate mock token → TokenManager
    └─→ [Real Account] Call API → Backend
```

## Components and Interfaces

### 1. BuildConfig Extension

Add a build configuration field to distinguish debug and release builds:

```kotlin
// In app/build.gradle.kts
buildTypes {
    debug {
        buildConfigField("boolean", "DEV_MODE_ENABLED", "true")
    }
    release {
        buildConfigField("boolean", "DEV_MODE_ENABLED", "false")
    }
}
```

### 2. DevModeConfig Object

Create a configuration object to centralize dev mode settings:

```kotlin
object DevModeConfig {
    const val TEST_USERNAME = "test"
    const val TEST_PASSWORD = "test123"
    const val TEST_USER_ID = "dev-user-001"
    const val MOCK_TOKEN_PREFIX = "mock_token_"
    
    val isEnabled: Boolean
        get() = BuildConfig.DEV_MODE_ENABLED
    
    fun isTestCredentials(username: String, password: String): Boolean {
        return username == TEST_USERNAME && password == TEST_PASSWORD
    }
    
    fun generateMockToken(): String {
        return "$MOCK_TOKEN_PREFIX${System.currentTimeMillis()}"
    }
}
```

### 3. AuthRepositoryImpl Enhancement

Modify the login method to check for test credentials:

```kotlin
override suspend fun login(username: String, password: String): NetworkResult<LoginResponse> {
    // Check for dev mode test credentials
    if (DevModeConfig.isEnabled && DevModeConfig.isTestCredentials(username, password)) {
        return handleDevModeLogin()
    }
    
    // Normal authentication flow
    val request = LoginRequest(username, password)
    val result = NetworkHelper.safeApiCall { apiService.login(request) }
    
    if (result is NetworkResult.Success) {
        val response = result.data
        tokenManager.saveToken(response.token)
        tokenManager.saveUserId(response.userId)
        tokenManager.saveTokenExpiry(response.expiresIn)
    }
    
    return result
}

private suspend fun handleDevModeLogin(): NetworkResult<LoginResponse> {
    val mockToken = DevModeConfig.generateMockToken()
    val mockResponse = LoginResponse(
        token = mockToken,
        userId = DevModeConfig.TEST_USER_ID,
        expiresIn = 86400000L // 24 hours
    )
    
    tokenManager.saveToken(mockResponse.token)
    tokenManager.saveUserId(mockResponse.userId)
    tokenManager.saveTokenExpiry(mockResponse.expiresIn)
    
    return NetworkResult.Success(mockResponse)
}
```

### 4. LoginScreen UI Enhancement

Add a "Use Test Account" button that appears only in dev mode:

```kotlin
@Composable
fun LoginScreen(
    viewModel: LoginViewModel = hiltViewModel(),
    onLoginSuccess: () -> Unit
) {
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    
    // ... existing code ...
    
    Column {
        // ... existing fields ...
        
        // Dev mode quick-fill button
        if (DevModeConfig.isEnabled) {
            OutlinedButton(
                onClick = {
                    username = DevModeConfig.TEST_USERNAME
                    password = DevModeConfig.TEST_PASSWORD
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.BugReport, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("使用测试账号")
            }
            
            Text(
                text = "开发模式已启用",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.secondary
            )
        }
        
        // ... login button ...
    }
}
```

## Data Models

No new data models are required. The existing `LoginResponse` model will be reused for mock responses.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Dev mode UI visibility consistency

*For any* login screen render state, the "Use Test Account" button and dev mode indicator should be visible if and only if dev mode is enabled.

**Validates: Requirements 1.3, 3.1, 3.4**

### Property 2: Mock token format consistency

*For any* successful dev mode login, the generated mock token should start with the expected prefix and be stored using the same mechanism as real tokens.

**Validates: Requirements 2.2, 2.5**

### Property 3: Non-test credentials fallback

*For any* credentials that don't match the test account in dev mode, the system should attempt authentication against the real backend.

**Validates: Requirements 2.4**

### Property 4: Authentication state equivalence

*For any* authenticated session (whether from test or real credentials), the system should provide the same access to features and maintain state across restarts identically.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 5: Logout behavior consistency

*For any* authenticated session, logout should clear authentication state in the same way regardless of whether the session was created with test or real credentials.

**Validates: Requirements 4.4**

## Error Handling

1. **Invalid Credentials in Dev Mode**: If credentials don't match test account, fall through to normal authentication
2. **Release Build Protection**: If dev mode code is accidentally called in release builds, fail gracefully with no-op behavior
3. **Token Storage Failures**: Handle token storage failures the same way for both dev and production modes

## Testing Strategy

### Unit Tests

1. Test `DevModeConfig.isTestCredentials()` with various username/password combinations
2. Test `DevModeConfig.generateMockToken()` format validation
3. Test `AuthRepositoryImpl.handleDevModeLogin()` creates correct mock response
4. Test that dev mode login doesn't make network calls

### Property-Based Tests

Property-based tests will use Kotest property testing framework (already configured in the project).

1. **Property 1 Test**: Verify build config reflects correct dev mode state
2. **Property 2 Test**: Generate random credentials and verify only test credentials succeed in dev mode
3. **Property 3 Test**: Generate multiple mock tokens and verify format consistency
4. **Property 4 Test**: Test UI rendering with dev mode enabled/disabled
5. **Property 5 Test**: Verify token persistence across simulated app restarts

### Integration Tests

1. End-to-end test of dev mode login flow
2. Test switching between dev mode and normal authentication
3. Test logout with dev mode credentials

## Security Considerations

1. **Release Build Safety**: Dev mode must be completely disabled in release builds through compile-time constants
2. **No Backdoors**: Test credentials only work when explicitly enabled in debug builds
3. **Token Isolation**: Mock tokens should be clearly identifiable and never confused with real tokens
4. **Code Removal**: ProGuard rules ensure dev mode code is stripped from release builds
