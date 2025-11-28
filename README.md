# AI书签 (AI Bookmark)

一个智能书签应用，使用AI技术自动分析和分类你收藏的内容。

## 📱 项目简介

AI书签是一个Android应用，可以帮助用户快速收藏感兴趣的文本内容，并通过AI自动提取关键词、分类和生成摘要。

### 主要功能

- 📝 **文本收藏**：快速收藏选中的文本内容
- 🤖 **AI分析**：自动提取关键词、分类和生成摘要
- 🔍 **智能搜索**：根据关键词和分类搜索收藏
- 📱 **离线支持**：支持离线缓存和后台同步
- 🔐 **安全认证**：支持用户登录和数据加密

## 🏗️ 项目结构

```
AICollector/
├── app/                          # Android应用
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/example/aicollector/
│   │   │   │   ├── data/         # 数据层
│   │   │   │   ├── domain/       # 业务逻辑层
│   │   │   │   ├── presentation/ # UI层
│   │   │   │   ├── di/           # 依赖注入
│   │   │   │   ├── service/      # 后台服务
│   │   │   │   └── util/         # 工具类
│   │   │   └── res/              # 资源文件
│   │   └── test/                 # 测试
│   └── build.gradle.kts
├── backend/                      # 后端服务（Python）
│   ├── app/
│   │   ├── routes/              # API路由
│   │   └── models.py            # 数据模型
│   └── requirements.txt
└── docs/                        # 文档
```

## 🚀 快速开始

### 前置要求

- Android Studio Hedgehog | 2023.1.1 或更高版本
- JDK 11 或更高版本
- Android SDK (API 24+)
- Python 3.8+ (用于后端)

### Android应用

1. **克隆仓库**
   ```bash
   git clone <repository-url>
   cd AICollector
   ```

2. **打开项目**
   - 使用Android Studio打开项目
   - 等待Gradle同步完成

3. **配置后端地址**
   - 打开 `app/src/main/java/com/example/aicollector/di/NetworkModule.kt`
   - 修改 `BASE_URL` 为你的后端地址

4. **运行应用**
   - 连接Android设备或启动模拟器
   - 点击 Run 按钮

### 后端服务

1. **安装依赖**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件配置数据库等
   ```

3. **启动服务**
   ```bash
   python run.py
   ```

## 🔧 开发模式

应用内置了开发模式，方便快速测试：

- **测试账号**：test / test123
- **使用方法**：在登录界面点击"使用测试账号"按钮

详见：[开发模式使用指南](DEV_MODE_GUIDE.md)

## 📚 技术栈

### Android

- **语言**：Kotlin
- **UI框架**：Jetpack Compose
- **架构**：MVVM + Clean Architecture
- **依赖注入**：Hilt
- **网络**：Retrofit + OkHttp
- **数据库**：Room
- **异步**：Coroutines + Flow
- **测试**：JUnit, Kotest, MockK

### 后端

- **语言**：Python
- **框架**：Flask
- **数据库**：SQLite/PostgreSQL
- **API文档**：参见 [api-contract-v1.1.md](api-contract-v1.1.md)

## 📖 文档

- [API接口文档](api-contract-v1.1.md)
- [开发模式指南](DEV_MODE_GUIDE.md)
- [后端配置说明](BACKEND_CONFIGURATION.md)
- [联调测试清单](INTEGRATION_TESTING_CHECKLIST.md)
- [API对齐变更](API_ALIGNMENT_CHANGES.md)
- [项目重命名说明](PROJECT_RENAME_NOTE.md)

## 🧪 测试

### 运行单元测试

```bash
./gradlew test
```

### 运行属性测试

```bash
./gradlew test --tests "*PropertyTest"
```

## 🔐 安全性

- 使用EncryptedSharedPreferences存储敏感数据
- 支持HTTPS通信
- Token自动刷新机制
- 密码不记录日志

## 📝 API版本

当前API版本：**v1.1**

所有API接口路径前缀：`/api/v1/`

主要接口：
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/collect` - 提交收藏
- `GET /api/v1/collect/{collect_id}` - 查询收藏详情
- `GET /api/v1/collections` - 获取收藏列表

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

[MIT License](LICENSE)

## 👥 作者

- 前端开发：[Your Name]
- 后端开发：石金来

## 📞 联系方式

如有问题，请提交Issue或联系开发团队。

---

**注意**：本项目仍在开发中，部分功能可能不完整。
