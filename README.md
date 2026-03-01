# AI书签系统 (AI Bookmark System)

一个跨平台的智能书签管理系统，支持通过多种方式收藏内容并进行AI智能分析。

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

## 📁 项目结构

```
ai-bookmark/
├── ai/                     # AI分析模块
│   └── analyze.py          # 使用SiliconFlow API进行文本分析
├── app/                    # Android客户端应用
│   ├── src/main/java/com/example/aicollector/
│   │   ├── data/          # 数据层（API、数据库、仓库）
│   │   ├── domain/        # 业务逻辑层（用例、模型）
│   │   ├── presentation/  # 表现层（UI、ViewModel）
│   │   └── di/            # 依赖注入配置
├── backend/                # 后端服务（备用实现）
├── bot/                    # 微信机器人集成
├── chrome-extension/       # Chrome浏览器扩展
├── docs/                   # 文档文件
├── routes/                 # API路由模块
├── main.py                 # FastAPI主应用
├── requirements.txt        # Python依赖
├── railway.json            # Railway部署配置
└── README.md               # 项目文档
```

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

- [Android开发配置指南](./Android开发配置指南.md) - Android应用配置和开发
- [启动后端服务](./启动后端服务.md) - 后端服务启动指南
- [Android前端测试计划](./Android前端测试计划.md) - 完整的测试用例
- [网络连接问题解决方案](./网络连接问题解决方案.md) - 常见网络问题
- [PROJECT_SUMMARY](./PROJECT_SUMMARY.md) - 项目开发总结
- [WECHAT_ARTICLE_GUIDE](./WECHAT_ARTICLE_GUIDE.md) - 微信文章功能实现指南

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
- [x] 项目结构整理
- [x] Railway部署配置
- [x] 后端API开发（用户认证、收藏CRUD）
- [x] 微信文章解析接口
- [x] Chrome浏览器扩展开发
- [x] Android移动端完整功能
- [x] 微信机器人集成
- [x] 文章缓存机制
- [x] 离线支持

### 待完成 ⏳
- [ ] 数据库持久化存储（目前使用内存）
- [ ] AI分析功能完整集成
- [ ] 用户注册功能
- [ ] 收藏分类和搜索优化
- [ ] 性能优化和压力测试

## 🤝 团队协作

- **Android前端**：完成微信文章收藏功能
- **后端API**：完成基础功能和文章解析
- **Chrome扩展**：完成开发
- **微信机器人**：完成集成

## 📝 更新日志

### v1.0 (2026-03-01)
- ✨ 完成微信文章收藏功能
- 🎨 实现文章卡片UI组件
- 💾 添加文章缓存机制
- 📱 支持从微信分享文章
- 🔧 修复网络连接问题
- 📚 完善项目文档

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