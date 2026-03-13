# 🚀 AI书签系统 - 本地部署操作手册

## 📋 快速开始指南

本手册将指导您在本地环境中快速部署和运行AI书签系统，包括后端服务、Chrome扩展和Android应用。

---

## 🎯 系统要求

### 基础环境
- **Python**: 3.11+ (推荐3.11.0)
- **Node.js**: 16.0+
- **Git**: 最新版本
- **Chrome浏览器**: 最新版本 (用于扩展测试)
- **Android Studio**: Arctic Fox或更新版本 (可选，用于Android开发)

### 推荐配置
- **内存**: 4GB+
- **存储**: 2GB可用空间
- **网络**: 稳定互联网连接 (用于AI API调用)

---

## 🔧 第一步：环境准备

### 1.1 克隆项目
```bash
git clone https://github.com/jian-138/ai-bookmark.git
cd ai-bookmark
```

### 1.2 创建虚拟环境
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 1.3 安装Python依赖
```bash
pip install -r requirements.txt
```

### 1.4 获取AI API密钥
1. 访问 [SiliconFlow官网](https://siliconflow.cn/)
2. 注册账号并获取API密钥
3. 复制密钥备用

---

## 🌐 第二步：启动后端服务

### 2.1 配置环境变量
在项目根目录创建 `.env` 文件：
```env
SILICONFLOW_API_KEY=your_api_key_here
DATABASE_URL=sqlite:///./ai_bookmark.db
DEBUG=true
```

### 2.2 启动后端服务
```bash
# 方式1：使用uvicorn（推荐）
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 方式2：使用Python直接运行
python main.py
```

### 2.3 验证服务状态
- 访问 API文档：http://localhost:8000/docs
- 测试健康检查：http://localhost:8000/health
- 预期响应：`{"status":"healthy"}`

---

## 🧩 第三步：安装Chrome扩展

### 3.1 打开Chrome扩展管理
1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"

### 3.2 加载扩展
1. 点击"加载已解压的扩展程序"
2. 选择 `chrome-extension` 文件夹
3. 确认扩展已加载并启用

### 3.3 配置扩展
1. 点击浏览器工具栏的扩展图标
2. 使用测试账号登录：
   - 用户名：`test`
   - 密码：`test123`
3. 验证登录成功（显示主界面）

### 3.4 测试扩展功能
- **文本收藏**：选择网页文本，点击浮动按钮
- **右键收藏**：右键点击页面空白处
- **快捷键**：`Ctrl+Shift+S` (Windows) / `Cmd+Shift+S` (Mac)

---

## 📱 第四步：配置Android应用 (可选)

### 4.1 打开Android Studio
1. 启动Android Studio
2. 选择"Open an Existing Project"
3. 选择项目中的 `app` 文件夹

### 4.2 配置API地址
在 `app/src/main/java/com/example/ai_bookmark/data/remote/ApiService.kt` 中：
```kotlin
// 修改为本地地址
private const val BASE_URL = "http://10.0.2.2:8000/"
```

### 4.3 运行应用
1. 连接Android设备或启动模拟器
2. 点击"Run"按钮
3. 等待应用安装完成

---

## 🧪 第五步：功能验证

### 5.1 基础功能测试
```bash
# 测试登录
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# 预期响应：包含token的用户信息
```

### 5.2 收藏功能测试
```bash
# 测试创建收藏
curl -X POST "http://localhost:8000/api/v1/collections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"text":"测试收藏内容","url":"https://example.com"}'
```

### 5.3 周报功能测试
1. 在Chrome扩展中收藏几条内容
2. 点击"周报"按钮
3. 验证显示收藏统计和分析结果

---

## 🔧 第六步：故障排除

### 常见问题

#### 6.1 后端服务无法启动
```bash
# 检查端口占用
netstat -ano | findstr :8000

# 更换端口
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

#### 6.2 Chrome扩展登录失败
```bash
# 检查网络连接
curl http://localhost:8000/health

# 检查扩展权限
# 确认manifest.json中的权限配置
```

#### 6.3 Android应用连接失败
- 确认使用正确的IP地址：`10.0.2.2` (模拟器)
- 检查防火墙设置
- 确认后端服务已启动

#### 6.4 AI分析功能异常
- 检查API密钥是否正确配置
- 验证网络连接状态
- 查看后端日志获取详细错误信息

---

## 📊 第七步：性能优化

### 7.1 数据库优化
```bash
# 创建数据库索引
python -c "from backend.database import create_indexes; create_indexes()"
```

### 7.2 缓存配置
在 `.env` 文件中添加：
```env
CACHE_TTL=86400
MAX_CACHE_SIZE=1000
```

### 7.3 日志配置
```python
# 在main.py中配置日志级别
import logging
logging.basicConfig(level=logging.INFO)
```

---

## 🎯 第八步：开发环境扩展

### 8.1 热重载配置
```bash
# 安装开发依赖
pip install watchdog

# 启用热重载
uvicorn main:app --reload --reload-dir .
```

### 8.2 调试工具
```bash
# 安装调试工具
pip install ipdb
pip install debugpy
```

### 8.3 代码质量检查
```bash
# 安装检查工具
pip install black flake8 mypy

# 格式化代码
black .

# 检查代码风格
flake8 .

# 类型检查
mypy .
```

---

## 📚 相关文档

### 核心文档
- [Android开发配置指南](./Android开发配置指南.md) - Android应用配置和开发
- [启动后端服务](./启动后端服务.md) - 后端服务启动指南
- [项目开发总结](./PROJECT_SUMMARY.md) - 项目开发总结
- [使用指南](./USAGE_GUIDE.md) - 使用指南

### 技术文档
- [Flask到FastAPI迁移](./FLASK_TO_FASTAPI_MIGRATION.md) - 框架迁移文档
- [后端启动指南](./BACKEND_STARTUP_GUIDE.md) - 后端启动指南
- [前后端连接说明](./FRONTEND_BACKEND_CONNECTION.md) - 前后端连接说明

---

## 🆘 技术支持

### 获取帮助
1. **查看日志**：检查后端控制台输出
2. **API文档**：访问 http://localhost:8000/docs
3. **测试工具**：使用项目中的测试脚本
4. **社区支持**：在GitHub Issues中提问

### 测试账号
- 用户名：`test`
- 密码：`test123`

### 默认配置
- 后端地址：`http://localhost:8000`
- API版本：`v1`
- 数据库：`SQLite` (本地开发)

---

## 🎉 恭喜！

您已成功完成AI书签系统的本地部署！现在可以：

✅ **使用Chrome扩展**收藏网页内容
✅ **查看AI分析结果**（关键词、分类、摘要）
✅ **生成周报**查看收藏统计
✅ **开发Android应用**（如需要）

**下一步建议**：
- 探索更多功能特性
- 自定义配置参数
- 参与项目开发贡献

---

*最后更新：2026年3月13日*

---

# AI书签系统 (AI Bookmark System)

一个跨平台的智能书签管理系统，支持通过多种方式收藏内容并进行AI智能分析。

> **最新更新**：项目已完成全面清理和优化，删除46个冗余文件，项目结构更加清晰！

## 📊 项目状态

✅ **已完成**：项目结构优化、文档清理、GitHub推送  
📱 **Android 应用**：完整功能，开箱即用  
🌐 **后端 API**：稳定运行，支持多平台  
🔧 **Chrome 扩展**：功能完整，支持收藏管理  
📈 **周报功能**：新增收藏内容总结和关键词整理

## ✨ 核心特性

- 🤖 **AI内容分析与自动分类**（基于SiliconFlow API）
- 📱 **多平台支持**：Android移动端、Web浏览器插件、微信机器人
- 🔗 **统一的后端API服务**（FastAPI）
- ☁️ **Railway云平台部署**
- 💾 **离线缓存和数据同步**
- 📰 **微信公众号文章收藏和解析**
- 📊 **智能周报生成**：收藏内容总结、关键词整理、趋势分析

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

### Chrome扩展

```bash
# 1. 打开Chrome扩展管理页面
chrome://extensions/

# 2. 开启开发者模式
# 3. 点击"加载已解压的扩展程序"
# 4. 选择 chrome-extension 文件夹
```

---

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
│   ├── popup.js           # 扩展主逻辑
│   ├── popup.html         # 扩展界面
│   ├── enhanced-weekly-report.css  # 增强周报样式
│   ├── detailed-collections.css    # 详细收藏样式
│   └── weekly-report-functions.js  # 周报功能增强
├── docs/                   # ✅ 核心文档
├── routes/                 # ✅ API路由模块
├── backup/                 # 🔒 备份目录（已忽略）
├── main.py                 # ✅ FastAPI主应用
├── requirements.txt        # ✅ Python依赖
├── railway.json            # ✅ Railway部署配置
├── LOCAL_DEPLOYMENT_GUIDE.md  # ✅ 本地部署操作手册
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

### Chrome扩展（新增增强功能）
- ✅ 文本选择浮动按钮
- ✅ 右键菜单收藏
- ✅ 快捷键收藏（Ctrl+Shift+S）
- ✅ 收藏列表查看
- ✅ 离线缓存
- ✅ **智能周报生成**：
  - 📊 收藏内容统计分析
  - 🔑 关键词智能整理
  - 📈 收藏趋势分析
  - 📋 内容类型分布
  - 🌐 来源网站分析
  - 📅 每日收藏趋势
  - 💾 周报导出功能
  - 🔍 关键词点击搜索

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
- 增强CSS样式和动画效果

### 微信机器人
- Node.js + Wechaty
- Axios HTTP客户端

## 📚 文档

### 核心文档
- [📖 本地部署操作手册](./LOCAL_DEPLOYMENT_GUIDE.md) - **完整本地部署指南**
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

---

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
- [x] **周报功能增强** - 收藏内容总结、关键词整理、趋势分析

### 待优化 🔧
- [ ] 数据库持久化存储（目前使用内存）
- [ ] 用户注册功能扩展
- [ ] 收藏分类和搜索优化
- [ ] 性能优化和压力测试
- [ ] 多语言支持

> **当前状态**：项目已进入稳定维护阶段，核心功能完整可用，周报功能大幅增强。

## 📝 更新日志

### v1.3 (2026-03-13)
- 📊 **增强周报功能** - 新增收藏内容总结、关键词整理、趋势分析
- 🎨 **美化界面** - 添加增强CSS样式和动画效果
- 🔧 **功能优化** - 改进关键词点击搜索和导出功能
- 📚 **完善文档** - 添加本地部署操作手册

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