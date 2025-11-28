# 构建错误修复指南

## 已修复的问题

### 问题：SyncWorker 编译错误
**错误信息**: `NonExistentClass无法转换为Annotation`

**原因**: 
- 缺少 Hilt WorkManager 依赖
- `@HiltWorker` 注解需要额外的配置

**解决方案**:
1. ✅ 添加了 `hilt-work` 依赖到 `gradle/libs.versions.toml`
2. ✅ 更新了 `app/build.gradle.kts` 添加 `implementation(libs.hilt.work)`
3. ✅ 简化了 `SyncWorker.kt`，移除了 Hilt 依赖注入

## 如何重新构建

### 方法1: 在 Android Studio 中
1. 点击 **File** → **Sync Project with Gradle Files**
2. 等待同步完成
3. 点击 **Build** → **Rebuild Project**
4. 点击 **Run** → **Run 'app'**

### 方法2: 使用命令行（需要配置 Java）
```bash
# 清理构建
./gradlew clean

# 构建项目
./gradlew build

# 安装到设备
./gradlew installDebug
```

## 如果仍有错误

### 1. 检查 Gradle 同步
确保 Gradle 同步成功：
- 查看 Android Studio 底部的 **Build** 标签
- 确认没有依赖下载失败

### 2. 清理缓存
```bash
./gradlew clean
```
或在 Android Studio 中：
**File** → **Invalidate Caches / Restart**

### 3. 检查 JDK 版本
项目需要 JDK 11：
- **File** → **Project Structure** → **SDK Location**
- 确认 JDK 版本为 11 或更高

### 4. 检查 Android SDK
确保已安装：
- Android SDK Platform 34
- Android SDK Build-Tools
- Android SDK Platform-Tools

## 常见错误及解决方案

### 错误: "Unresolved reference: hilt"
**解决**: 
- 同步 Gradle: **File** → **Sync Project with Gradle Files**
- 确保网络连接正常，依赖可以下载

### 错误: "Manifest merger failed"
**解决**:
- 检查 `AndroidManifest.xml` 语法
- 确保所有服务和接收器正确声明

### 错误: "Duplicate class found"
**解决**:
- 运行 `./gradlew clean`
- 删除 `app/build` 目录
- 重新构建

## 验证构建成功

构建成功后，你应该看到：
```
BUILD SUCCESSFUL in Xs
```

然后可以：
1. 在模拟器或真实设备上运行应用
2. 授予必要的权限
3. 测试核心功能

## 需要帮助？

如果遇到其他错误：
1. 查看完整的错误堆栈
2. 检查 `Build` 窗口的详细输出
3. 确认所有依赖都已正确下载

## 已更新的文件

- ✅ `gradle/libs.versions.toml` - 添加 hilt-work 依赖
- ✅ `app/build.gradle.kts` - 添加 hilt-work 实现
- ✅ `app/src/main/java/com/example/aicollector/service/SyncWorker.kt` - 简化实现

## 下一步

构建成功后：
1. 运行应用
2. 完成权限授予流程
3. 测试文本收藏功能
4. 查看 `PROJECT_COMPLETE.md` 了解完整功能
