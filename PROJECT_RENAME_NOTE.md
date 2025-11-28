# 项目重命名说明

## 项目名称变更

**旧名称**: AI收藏夹 / AI Collector  
**新名称**: AI书签 / AI Bookmark

## 已更新的内容

### 用户可见文本
✅ **LoginScreen.kt** - 登录界面标题改为"AI书签"
✅ **strings.xml** - 应用名称改为"AI书签"
✅ **strings.xml** - 无障碍服务描述更新
✅ **api-contract-v1.1.md** - 接口文档标题更新
✅ **DEV_MODE_GUIDE.md** - 开发模式指南标题更新

### 保持不变的内容（技术原因）

以下内容保持使用原有的`aicollector`命名，原因如下：

#### 1. 包名和命名空间
```
com.example.aicollector
```
**保持原因**: 
- 修改包名需要重构整个项目的所有Kotlin文件
- 需要移动数百个文件到新的目录结构
- 需要更新所有import语句
- 风险高，容易引入错误
- 包名对用户不可见，不影响用户体验

#### 2. 应用ID
```
applicationId = "com.example.aicollector"
```
**保持原因**:
- 应用ID是应用在Google Play的唯一标识
- 修改后会被视为全新应用
- 已安装的用户无法升级，需要重新安装
- 用户数据会丢失

#### 3. 目录结构
```
app/src/main/java/com/example/aicollector/
```
**保持原因**:
- 与包名对应
- 修改需要移动所有源代码文件
- IDE重构工具可能不完全可靠

#### 4. 数据库和SharedPreferences
```
secure_prefs
collections
pending_collections
```
**保持原因**:
- 修改会导致用户数据丢失
- 需要实现数据迁移逻辑
- 增加复杂度和风险

## 对用户的影响

### 用户可见
- ✅ 应用名称显示为"AI书签"
- ✅ 登录界面显示"AI书签"
- ✅ 系统设置中显示为"AI书签"

### 用户不可见
- 包名仍为`com.example.aicollector`（用户看不到）
- 内部代码引用仍使用`aicollector`（用户看不到）

## 建议

如果将来确实需要完全重命名项目（包括包名），建议：

1. **创建新项目**: 使用正确的包名创建全新项目
2. **迁移代码**: 逐步迁移功能代码到新项目
3. **数据迁移**: 实现从旧应用到新应用的数据迁移
4. **发布策略**: 
   - 新应用作为独立应用发布
   - 旧应用提示用户迁移到新应用
   - 保持旧应用一段时间以便用户迁移

## 当前状态

✅ 所有用户可见的文本已更新为"AI书签"  
✅ 代码功能完全正常  
✅ 不影响现有功能和数据  
✅ 编译和运行正常  

## 文件清单

### 已修改的文件
1. `app/src/main/java/com/example/aicollector/presentation/ui/LoginScreen.kt`
2. `app/src/main/res/values/strings.xml`
3. `api-contract-v1.1.md`
4. `DEV_MODE_GUIDE.md`

### 未修改的文件（保持原有命名）
- 所有Kotlin源代码文件的package声明
- `app/build.gradle.kts`中的namespace和applicationId
- `AndroidManifest.xml`中的package声明
- 所有目录结构
- 数据库和SharedPreferences键名

## 总结

项目已成功更名为"AI书签"，所有用户可见的地方都已更新。内部技术实现保持使用`aicollector`命名以确保稳定性和数据兼容性。这是Android开发中的常见做法，不会影响用户体验。
