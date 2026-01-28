# AI书签系统 - 更新日志

**版本规范**: 遵循语义化版本 (Semantic Versioning)  
**格式**: 按时间倒序排列，最新更新在最前

---

## [v1.0.0] - 2026-01-28

### 新增功能 ✨

#### Chrome浏览器扩展
- **文本选择收藏**: 选中网页文本自动显示浮动收藏按钮
- **右键菜单收藏**: 右键选中文本即可快速收藏
- **快捷键收藏**: 支持Ctrl+Shift+S快捷键收藏
- **用户登录系统**: 扩展内置登录界面，支持test/test123测试账号
- **收藏列表查看**: 弹窗界面展示所有收藏，带AI标签和摘要
- **离线缓存队列**: 网络断开时自动缓存，恢复后同步
- **Toast提示**: 优雅的操作反馈提示

**Commit**: `0c727dc` - feat: 添加Chrome浏览器扩展实现AI书签收藏功能

#### 后端API
- **内存存储机制**: 实现collections_storage列表存储收藏数据
- **数据持久化**: 收藏提交后立即保存到内存，支持实时查询
- **收藏列表接口优化**: 修复返回数据结构，前端可正确解析

**Commit**: `21c8fbe` - fix: 修复收藏列表显示问题 - 添加内存存储和修复数据访问路径

#### Android移动端
- **Railway环境对接**: 配置NetworkModule连接生产环境
- **API Base URL更新**: 指向ai-bookmark-production.up.railway.app

**Commit**: `79f5077` - feat: 配置Android应用连接Railway生产环境

#### 微信机器人
- **公众号文章支持**: 识别和收藏公众号文章链接
- **链接卡片解析**: 支持URL类型消息（链接卡片）
- **用户ID简化**: 自动生成基于微信ID的用户标识
- **API连接**: 对接本地后端服务 http://10.81.5.132:8000

**Commit**: `e04cfc9` - feat: 完善微信机器人支持公众号文章收藏，连接本地API

### 问题修复 🐛

#### Chrome扩展加载失败
- **问题**: content.css文件缺失导致扩展无法加载
- **原因**: 之前创建时使用PowerShell多行字符串失败
- **解决**: 重新创建完整的content.css文件，包含浮动按钮和Toast样式
- **影响**: 阻塞扩展安装和使用
- **Commit**: `6c35406` - fix: 修复Chrome扩展manifest配置和content.css缺失问题

#### Manifest配置错误
- **问题**: manifest.json中引用了不存在的图标文件
- **解决**: 移除可选的图标配置，创建icons目录占位
- **改进**: 扩展可以无图标加载，后续添加图标即可

#### 收藏列表不显示
- **问题**: 前端无法看到新提交的收藏内容
- **原因**: 后端返回模拟数据，前端数据访问路径response.data.data不正确
- **解决**: 
  1. 后端实现collections_storage内存列表
  2. 收藏提交时插入到列表开头
  3. 前端修复数据访问逻辑，添加调试日志
- **影响**: 用户体验问题，无法验证收藏功能
- **Commit**: `21c8fbe`

### 改进优化 ⚡

#### Railway部署配置
- **问题**: build.builder字段值"DOCKER"导致部署失败
- **解决**: 改为"DOCKERFILE"，添加$schema声明
- **改进**: 配置更加规范，符合Railway要求
- **Commit**: `7a87f07` - fix: 修复railway.json配置错误 - 使用DOCKERFILE构建器并添加schema

#### 项目结构整理
- **清理**: 删除重复目录ai-bookmark-1/、linkwarden-main/
- **优化**: 文档移至docs/目录统一管理
- **改进**: .gitignore规则优化，排除临时文件
- **Commit**: `540c9f0` - chore: 整理项目结构，清理重复文件和临时文件

### 文档更新 📝

- **移动端配置指南**: 创建MOBILE_SETUP_GUIDE.md
- **Chrome扩展说明**: 创建chrome-extension/README.md
- **项目进度报告**: 创建docs/PROGRESS.md
- **本更新日志**: 创建docs/CHANGELOG.md

**Commit**: `db20eeb` - docs: 添加移动端配置指南

---

## [v0.9.0] - 2026-01-27

### 新增功能 ✨

#### 移动端API支持
- **用户认证**: POST /api/v1/auth/login
- **收藏提交**: POST /api/v1/collect
- **收藏列表**: GET /api/v1/collections（分页）
- **收藏详情**: GET /api/v1/collect/{id}
- **收藏搜索**: GET /api/v1/collections/search
- **收藏删除**: DELETE /api/v1/collections/{id}
- **CORS配置**: 支持跨域请求，allow_origins=["*"]

**Commit**: `e82c08d` - feat: 添加移动端完整API支持 - 用户认证、收藏CRUD、CORS配置

#### 测试账号系统
- **用户名**: test
- **密码**: test123
- **Token**: 自动生成UUID格式token
- **User ID**: 自动生成usr_前缀的UUID

### 改进优化 ⚡

#### API响应格式统一
- 所有接口返回统一的success字段
- 错误信息包含详细的message和detail
- HTTP状态码正确映射（200, 201, 400, 401, 404）

---

## [v0.8.0] - 2025-12

### 新增功能 ✨

#### Docker容器化
- 创建Dockerfile，基于python:3.11-slim
- 配置railway.json部署文件
- 设置环境变量和端口映射
- 支持一键部署到Railway

**Commit**: 相关Docker配置提交

#### AI分析接口
- 本地测试接口: POST /analyze
- 正式接口: POST /internal/ai/analyze
- 集成SiliconFlow API
- 返回关键词、分类、摘要、置信度

### 问题修复 🐛

#### 依赖缺失
- **问题**: 缺少python-dotenv和requests模块
- **解决**: 更新requirements.txt，添加所需依赖
- **Commit**: 相关依赖更新提交

---

## [v0.7.0] - 2025-11

### 新增功能 ✨

#### 数据模型定义
- 定义collects表结构
- 设计API接口契约
- 创建api-contract-v1.1.md文档

#### Android项目初始化
- Jetpack Compose UI框架
- Retrofit网络层
- Hilt依赖注入
- Room数据库配置

---

## [v0.6.0] - 2025-10

### 新增功能 ✨

#### 项目初始化
- 创建GitHub仓库
- 初始化FastAPI项目
- 配置基础目录结构
- 编写README.md

---

## 待发布功能 🚀

### 计划中 (v1.1.0)
- [ ] PostgreSQL数据库持久化
- [ ] 用户注册功能
- [ ] 收藏分类和标签
- [ ] 高级搜索（全文搜索）
- [ ] AI分析结果缓存

### 未来规划 (v1.2.0+)
- [ ] 公众号文章解析接口
- [ ] 批量导入导出
- [ ] 数据统计和可视化
- [ ] 多语言支持
- [ ] 桌面客户端

---

## 版本说明

### 版本号规则
- **主版本号**: 重大架构变更或不兼容更新
- **次版本号**: 新增功能或重要改进
- **修订号**: Bug修复和小改进

### 标签说明
- ✨ **新增功能** (feat): 全新功能实现
- 🐛 **问题修复** (fix): Bug修复
- ⚡ **改进优化** (refactor/perf): 性能优化或代码重构
- 📝 **文档更新** (docs): 文档变更
- 🔧 **配置变更** (chore): 构建、配置相关

### Commit规范
遵循Conventional Commits规范：
```
<type>(<scope>): <subject>

<body>
```

类型:
- feat: 新功能
- fix: 修复
- docs: 文档
- style: 格式
- refactor: 重构
- perf: 性能
- test: 测试
- chore: 构建/工具

---

**维护**: 项目团队  
**最后更新**: 2026-01-28  
**文档版本**: v1.0
