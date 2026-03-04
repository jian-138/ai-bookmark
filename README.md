# AI书签系统 (AI Bookmark System)

一个跨平台的智能书签管理系统，支持通过多种方式收藏内容并进行AI智能分析。

> **最新更新**：项目已完成全面清理和优化，删除46个冗余文件，项目结构更加清晰！

## 📊 项目状态

✅ **已完成**：项目结构优化、文档清理、GitHub推送  
📱 **Android 应用**：完整功能，开箱即用  
🌐 **后端 API**：稳定运行，支持多平台  
🔧 **Chrome 扩展**：功能完整，支持收藏管理

## ✨ 核心特性

- 🤖 AI内容分析与自动分类（基于SiliconFlow API）
- 📱 多平台支持：Android移动端、Web浏览器插件、微信机器人
- 🔗 统一的后端API服务（FastAPI）
- ☁️ Railway云平台部署
- 💾 离线缓存和数据同步
- 📰 微信公众号文章收藏和解析

## 🚀 快速开始

### Android应用（开箱即用）

```bash
# 1. 克隆项目
git clone https://github.com/jian-138/ai-bookmark.git
cd ai-bookmark

# 2. 用Android Studio打开项目

# 3. 点击运行按钮
```

**默认配置**：
- API地址：`https://ai-bookmark-production.up.railway.app/`
- 测试账号：`test` / `test123`

详细配置请查看：[Android开发配置指南.md](./Android开发配置指南.md)

### 后端服务

```bash
# 启动本地后端
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 访问API文档
http://localhost:8000/docs
```

详细说明请查看：[启动后端服务.md](./启动后端服务.md)

## 📁 项目结构（优化后）

```
ai-bookmark/
├── ai/                     # ✅ AI分析模块
│   ├── analyze.py          # 使用SiliconFlow API进行文本分析
│   ├── ai_processor.py     # AI处理核心逻辑
│   ├── cache.py            # 缓存管理
│   └── __init__.py
├── app/                    # ✅ Android客户端应用
│   └── src/
│       ├── main/           # 主应用代码
│       ├── test/           # 单元测试（10个属性测试）
│       └── androidTest/    # 仪器测试
├── backend/                # ✅ 后端服务模块化
│   ├── app/               # 应用层
│   ├── routes/            # 路由层
│   ├── services/          # 服务层
│   └── database.py        # 数据库配置
├── bot/                    # ✅ 微信机器人集成
├── chrome-extension/       # ✅ Chrome浏览器扩展
├── docs/                   # ✅ 核心文档
├── routes/                 # ✅ API路由模块
├── backup/                 # 🔒 备份目录（已忽略）
├── main.py                 # ✅ FastAPI主应用
├── requirements.txt        # ✅ Python依赖
├── railway.json            # ✅ Railway部署配置
└── README.md               # ✅ 项目文档
```

> **优化说明**：项目已完成清理，删除46个冗余文件（测试脚本、调试文件、过时文档），保留核心功能文件。

## 🎯 功能特性

### Android移动端
- ✅ 微信公众号文章收藏
- ✅ URL粘贴和自动解析
- ✅ 文章预览和编辑
- ✅ 文章卡片展示（区分文章和文本）
- ✅ AI分析结果展示（关键词、分类、摘要）
- ✅ 离线缓存（24小时，最多50条）
- ✅ 从微信分享文章到应用
- ✅ 文章详情页面

### 后端API
- ✅ 用户认证（登录）
- ✅ 收藏管理（创建、查询、删除）
- ✅ 微信文章解析
- ✅ AI内容分析
- ✅ CORS跨域支持

### Chrome扩展
- ✅ 文本选择浮动按钮
- ✅ 右键菜单收藏
- ✅ 快捷键收藏（Ctrl+Shift+S）
- ✅ 收藏列表查看
- ✅ 离线缓存

### 微信机器人
- ✅ 公众号文章收藏
- ✅ 链接卡片识别
- ✅ 文本内容收藏

## 🛠️ 技术栈

### 后端
- FastAPI + Python 3.11
- Uvicorn ASGI服务器
- BeautifulSoup4（HTML解析）
- SiliconFlow API（AI分析）

### Android前端
- Kotlin + Jetpack Compose
- Clean Architecture + MVVM
- Retrofit + OkHttp（网络请求）
- Room（本地数据库）
- Hilt（依赖注入）
- Coil（图片加载）

### Chrome扩展
- Manifest V3
- Vanilla JavaScript
- Chrome Extension APIs

### 微信机器人
- Node.js + Wechaty
- Axios HTTP客户端

## 📚 文档

### 核心文档
- [Android开发配置指南](./Android开发配置指南.md) - Android应用配置和开发
- [启动后端服务](./启动后端服务.md) - 后端服务启动指南
- [PROJECT_SUMMARY](./PROJECT_SUMMARY.md) - 项目开发总结
- [USAGE_GUIDE](./USAGE_GUIDE.md) - 使用指南
- [WECHAT_ARTICLE_GUIDE](./WECHAT_ARTICLE_GUIDE.md) - 微信文章功能实现指南

### 技术文档
- [FLASK_TO_FASTAPI_MIGRATION](./FLASK_TO_FASTAPI_MIGRATION.md) - 框架迁移文档
- [BACKEND_STARTUP_GUIDE](./BACKEND_STARTUP_GUIDE.md) - 后端启动指南
- [FRONTEND_BACKEND_CONNECTION](./FRONTEND_BACKEND_CONNECTION.md) - 前后端连接说明

### 清理和优化报告
- [BUILD_AND_PUSH_SUMMARY](./BUILD_AND_PUSH_SUMMARY.md) - 项目构建和推送总结
- [DOCS_CLEANUP_REPORT](./DOCS_CLEANUP_REPORT.md) - 文档清理详细报告

### 变更记录
- [docs/CHANGELOG.md](./docs/CHANGELOG.md) - 变更日志
- [docs/PROGRESS.md](./docs/PROGRESS.md) - 开发进度

## 🌐 部署

### Railway部署（生产环境）

项目已配置Railway自动部署：
- 生产环境：https://ai-bookmark-production.up.railway.app
- API文档：https://ai-bookmark-production.up.railway.app/docs

### Docker部署

```bash
# 构建Docker镜像
docker build -t ai-bookmark .

# 运行应用
docker run -p 8000:8000 ai-bookmark
```

## 🧪 测试

### 测试账号
- 用户名：`test`
- 密码：`test123`

### API测试
访问：http://localhost:8000/docs

### Android测试
参考：[Android前端测试计划.md](./Android前端测试计划.md)

## 📊 开发进度

### 已完成 ✅
- [x] **项目结构优化** - 删除46个冗余文件，保留核心功能
- [x] **Railway部署配置** - 生产环境稳定运行
- [x] **后端API开发** - 用户认证、收藏CRUD、微信文章解析
- [x] **Chrome浏览器扩展** - 完整功能，支持收藏管理
- [x] **Android移动端** - 完整功能，开箱即用
- [x] **微信机器人集成** - 支持文章收藏
- [x] **文章缓存机制** - 离线支持，24小时缓存
- [x] **AI分析功能** - 基于SiliconFlow API的智能分析
- [x] **文档整理** - 完善的项目文档体系

### 待优化 🔧
- [ ] 数据库持久化存储（目前使用内存）
- [ ] 用户注册功能扩展
- [ ] 收藏分类和搜索优化
- [ ] 性能优化和压力测试
- [ ] 多语言支持

> **当前状态**：项目已进入稳定维护阶段，核心功能完整可用。

## 🤝 团队协作

- **Android前端**：完成微信文章收藏功能
- **后端API**：完成基础功能和文章解析
- **Chrome扩展**：完成开发
- **微信机器人**：完成集成

## 📝 更新日志

### v1.2 (2026-03-04)
- 🧹 **项目结构优化** - 删除46个冗余文件，清理测试脚本和调试文件
- 📚 **文档体系完善** - 添加清理报告和构建总结文档
- 🔧 **代码质量提升** - 优化.gitignore配置，保留核心功能
- 🚀 **GitHub推送** - 完成所有代码提交和推送

### v1.1 (2026-03-02)
- 🔧 **后端重构** - 模块化后端代码结构
- 📱 **Android优化** - 完善收藏列表和详情页面
- 🌐 **API增强** - 改进错误处理和响应格式

### v1.0 (2026-03-01)
- ✨ **核心功能** - 完成微信文章收藏功能
- 🎨 **UI组件** - 实现文章卡片UI组件
- 💾 **缓存机制** - 添加文章缓存机制
- 📱 **平台支持** - 支持从微信分享文章
- 🔧 **问题修复** - 修复网络连接问题
- 📚 **文档完善** - 完善项目文档体系

## 📄 License

MIT License

## 🔗 相关链接

- GitHub仓库：https://github.com/jian-138/ai-bookmark.git
- Railway生产环境：https://ai-bookmark-production.up.railway.app
- API文档：https://ai-bookmark-production.up.railway.app/docs

---

**最后更新**: 2026-03-01  
**版本**: v1.0  
**状态**: ✅ 核心功能完成，可用于生产环境