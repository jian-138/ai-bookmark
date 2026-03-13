# 📦 项目依赖说明

## 🐍 Python依赖 (requirements.txt)

### Web框架
- **fastapi==0.120.3** - 现代、快速（高性能）的Web框架，用于构建API
- **uvicorn==0.22.0** - ASGI服务器，用于运行FastAPI应用

### 环境配置
- **python-dotenv==1.0.1** - 从.env文件加载环境变量

### HTTP请求
- **requests==2.31.0** - 简洁的HTTP库，用于发送HTTP请求

### HTML解析
- **beautifulsoup4==4.12.2** - 用于解析HTML和XML文档，提取微信文章内容

### AI集成
- **google-generativeai==0.8.5** - Google Gemini AI API客户端
- **google-ai-generativelanguage==0.6.15** - Google AI语言处理库
- **google-api-core** - Google API核心库
- **google-api-python-client** - Google API Python客户端
- **google-auth** - Google认证库
- **protobuf** - Protocol Buffers支持
- **tqdm** - 进度条显示

### 任务调度
- **schedule==1.2.0** - 轻量级任务调度库

### 数据库 (异步支持)
- **sqlalchemy>=2.0.23** - SQL工具包和ORM
- **aiosqlite>=0.19.0** - 异步SQLite数据库驱动

### 密码安全
- **bcrypt==4.1.2** - 密码哈希库，用于安全存储用户密码

---

## 🔧 开发环境依赖

### 代码质量工具
```bash
# 安装开发依赖
pip install black flake8 mypy

# 代码格式化
black .

# 代码风格检查
flake8 .

# 类型检查
mypy .
```

### 调试工具
```bash
# 安装调试工具
pip install ipdb debugpy
```

### 热重载工具
```bash
# 安装热重载工具
pip install watchdog
```

---

## 📱 Android依赖 (build.gradle)

### 核心库
- **Kotlin** - 主要编程语言
- **Jetpack Compose** - 现代UI工具包
- **AndroidX** - Android支持库

### 网络通信
- **Retrofit** - HTTP客户端
- **OkHttp** - 网络请求库
- **Gson** - JSON解析

### 本地存储
- **Room** - SQLite数据库ORM
- **DataStore** - 数据存储

### 依赖注入
- **Hilt** - 依赖注入框架

### 图片加载
- **Coil** - 图片加载库

### 架构组件
- **ViewModel** - UI相关数据管理
- **LiveData** - 可观察数据持有者
- **Navigation** - 导航组件

---

## 🌐 Chrome扩展依赖

### 运行时环境
- **Chrome浏览器** - 最新版本
- **Manifest V3** - 扩展清单格式

### 前端技术
- **Vanilla JavaScript** - 原生JavaScript
- **HTML5** - 标记语言
- **CSS3** - 样式表

### Chrome APIs
- **chrome.runtime** - 运行时API
- **chrome.storage** - 存储API
- **chrome.tabs** - 标签页API
- **chrome.contextMenus** - 右键菜单API

---

## 🤖 AI服务依赖

### SiliconFlow API
- **API端点**: https://api.siliconflow.cn
- **模型**: Qwen/Qwen2.5-7B-Instruct
- **功能**: 文本分析、关键词提取、分类

### Google Gemini API
- **API端点**: https://generativelanguage.googleapis.com
- **模型**: gemini-pro
- **功能**: 内容分析、摘要生成

---

## 🐳 Docker依赖

### 基础镜像
- **python:3.11-slim** - Python运行时环境

### 系统依赖
- **curl** - 用于健康检查
- **netcat** - 网络工具

---

## 🚀 部署依赖

### Railway平台
- **自动部署** - 基于GitHub的CI/CD
- **环境变量** - 自动配置
- **数据库** - PostgreSQL (生产环境)

### 本地开发
- **SQLite** - 轻量级数据库
- **文件系统** - 本地文件存储

---

## 🔒 安全依赖

### 认证
- **JWT** - JSON Web Token认证
- **bcrypt** - 密码哈希

### 网络安全
- **HTTPS** - 加密通信
- **CORS** - 跨域资源共享配置

---

## 📊 性能优化依赖

### 缓存
- **内存缓存** - 应用级缓存
- **浏览器缓存** - 扩展本地缓存

### 数据库优化
- **索引** - 数据库索引优化
- **连接池** - 数据库连接管理

---

## 🧪 测试依赖

### 单元测试
- **pytest** - Python测试框架
- **unittest** - Python标准测试库

### 集成测试
- **Postman** - API测试工具
- **curl** - 命令行HTTP测试

---

## 📋 版本兼容性

### Python版本
- **最低要求**: Python 3.8+
- **推荐版本**: Python 3.11+
- **测试版本**: Python 3.11.0

### 浏览器兼容性
- **Chrome**: 88+
- **Edge**: 88+
- **Firefox**: 78+

### Android版本
- **最低API级别**: 21 (Android 5.0)
- **目标API级别**: 34 (Android 14)

---

## 🔧 安装验证

### 验证Python依赖
```bash
# 检查已安装包
pip list

# 验证关键包
python -c "import fastapi; print(f'FastAPI: {fastapi.__version__}')"
python -c "import uvicorn; print(f'Uvicorn: {uvicorn.__version__}')"
```

### 验证后端服务
```bash
# 启动服务测试
python -c "import main; print('✅ 后端模块导入成功')"

# API测试
curl http://localhost:8000/health
```

### 验证Chrome扩展
```bash
# 检查扩展文件
ls -la chrome-extension/

# 验证manifest.json
python -c "import json; json.load(open('chrome-extension/manifest.json')); print('✅ 扩展配置有效')"
```

---

*最后更新：2026年3月13日*