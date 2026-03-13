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