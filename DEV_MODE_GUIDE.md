# 开发模式使用指南 - AI书签

## 概述

开发模式允许你在debug构建中使用测试账号快速登录，无需连接真实的后端服务器。

## 功能特性

### 1. 测试账号
- **用户名**: `test`
- **密码**: `test123`
- **测试用户ID**: `dev-user-001`

### 2. 快捷登录按钮
在debug构建中，登录界面会显示"使用测试账号"按钮（带扳手图标🔧），点击后自动填充测试凭据。

### 3. 开发模式指示器
登录界面底部会显示"开发模式已启用"文字，提醒你当前处于开发模式。

## 使用方法

### 方式一：手动输入
1. 打开应用（debug构建）
2. 在登录界面输入：
   - 用户名: `test`
   - 密码: `test123`
3. 点击"登录"按钮

### 方式二：快捷按钮
1. 打开应用（debug构建）
2. 点击"使用测试账号"按钮
3. 凭据会自动填充
4. 点击"登录"按钮

## 技术实现

### BuildConfig配置
```kotlin
// Debug构建
buildConfigField("boolean", "DEV_MODE_ENABLED", "true")

// Release构建
buildConfigField("boolean", "DEV_MODE_ENABLED", "false")
```

### 模拟Token生成
开发模式会生成格式为 `mock_token_<timestamp>` 的模拟token，有效期24小时。

### 安全性
- 开发模式**仅在debug构建中启用**
- Release构建会通过ProGuard规则完全移除开发模式代码
- 测试凭据不会影响生产环境

## 注意事项

1. **仅用于开发测试**: 开发模式仅用于本地开发和测试，不应在生产环境中使用
2. **Release构建自动禁用**: 在release构建中，开发模式会被完全禁用和移除
3. **功能完整性**: 使用测试账号登录后，可以访问所有应用功能
4. **状态持久化**: 测试账号的登录状态会像真实账号一样持久化

## 验证开发模式

### 检查是否启用
```kotlin
if (DevModeConfig.isEnabled) {
    // 开发模式已启用
}
```

### 检查构建类型
- Debug构建: 开发模式启用，显示快捷按钮
- Release构建: 开发模式禁用，不显示任何开发功能

## 故障排除

### 问题：看不到"使用测试账号"按钮
**解决方案**: 确保你运行的是debug构建，而不是release构建

### 问题：测试账号无法登录
**解决方案**: 
1. 检查用户名和密码是否正确（test/test123）
2. 确认是在debug构建中运行
3. 查看日志确认DevModeConfig.isEnabled返回true

### 问题：Release构建中仍能看到开发模式功能
**解决方案**: 
1. 清理项目: `./gradlew clean`
2. 重新构建release版本
3. 检查ProGuard规则是否正确应用

## 相关文件

- `DevModeConfig.kt`: 开发模式配置对象
- `AuthRepositoryImpl.kt`: 认证仓库实现（包含开发模式登录逻辑）
- `LoginScreen.kt`: 登录界面（包含开发模式UI）
- `app/build.gradle.kts`: 构建配置（BuildConfig字段）
- `proguard-rules.pro`: ProGuard规则（移除开发模式代码）
