# AI书签收藏助手使用指南

## 项目概述

AI书签收藏助手是一款智能收藏工具，可以帮助用户收藏网页内容并使用AI技术进行分析。支持微信公众号文章收藏、智能标签提取和内容摘要等功能。

## 快速开始

### 1. 环境准备

1. 确保您的计算机已安装 Python 3.8 或更高版本
2. 克隆项目代码：
   ```bash
   git clone <repository-url>
   cd ai-bookmark
   ```
3. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```

### 2. 启动服务

1. 在项目根目录下运行以下命令启动后端服务：
   ```bash
   python main.py
   ```
   或者使用 uvicorn：
   ```bash
   uvicorn main:app --reload --port 8000
   ```

2. 服务启动后，默认访问地址为：`http://localhost:8000`

### 3. 访问不同版本

- **首页**: `http://localhost:8000`
- **移动端**: `http://localhost:8000/mobile`
- **微信版**: `http://localhost:8000/wechat`
- **API文档**: `http://localhost:8000/docs`

## 功能说明

### 1. 智能收藏

#### Chrome扩展收藏
1. 安装Chrome扩展（位于项目根目录的 `chrome-extension` 文件夹）
2. 在Chrome浏览器中打开 `chrome://extensions/`
3. 开启开发者模式，点击"加载已解压的扩展程序"，选择 `chrome-extension` 文件夹
4. 在任意网页选中需要收藏的文字内容
5. 右键选择"收藏选中内容到AI书签"，或点击扩展图标进行收藏

#### 手动收藏
1. 访问首页或移动端页面
2. 使用测试账号登录：用户名 `test`，密码 `test123`
3. 输入需要收藏的内容并提交

### 2. AI分析功能

系统会自动对收藏的内容进行AI分析，包括：
- 关键词提取
- 内容分类
- 摘要生成
- 置信度评估

### 3. 微信公众号文章收藏

对于微信公众号文章，系统会特别优化处理：
1. 在微信中阅读公众号文章
2. 长按选中需要收藏的内容并复制
3. 通过"在浏览器中打开"访问收藏页面
4. 提交复制的内容

## 移动端使用

1. 确保移动设备与运行服务的电脑在同一WiFi网络中
2. 在移动设备浏览器中访问：`http://[电脑IP]:8000`
3. 例如：如果电脑IP是192.168.1.100，则访问 `http://192.168.1.100:8000`

## API接口

### 用户认证
- **POST** `/api/v1/auth/login`
- 请求体：
  ```json
  {
    "username": "test",
    "password": "test123"
  }
  ```

### 提交收藏
- **POST** `/api/v1/collect`
- Headers: `Authorization: Bearer {token}`
- 请求体：
  ```json
  {
    "user_id": "user_id",
    "original_text": "要收藏的文本内容",
    "url": "可选的来源URL"
  }
  ```

### 获取收藏列表
- **GET** `/api/v1/collections`
- Headers: `Authorization: Bearer {token}`

## 常见问题

### 1. 微信内置浏览器功能受限

微信内置浏览器对某些功能有限制，建议点击右上角菜单选择"在浏览器中打开"以获得完整功能体验。

### 2. 无法访问服务

- 检查服务是否正常启动
- 确保防火墙未阻止相应端口
- 确保设备在同一网络中

### 3. AI分析失败

- 检查网络连接
- 确认AI服务配置正确
- 查看日志获取更多信息

## 配置说明

### 环境变量

在项目根目录下创建 `.env` 文件：

```env
# AI服务配置
OPENAI_API_KEY=your_api_key_here

# 数据库配置
DATABASE_URL=sqlite:///./collections.db

# 服务器配置
HOST=0.0.0.0
PORT=8000
```

## 扩展开发

### Chrome扩展

Chrome扩展位于 `chrome-extension` 目录，主要文件包括：

- `manifest.json` - 扩展配置
- `content.js` - 内容脚本，捕获用户选择的文本
- `background.js` - 后台脚本，处理API通信
- `popup.html/css/js` - 弹出界面

## 部署

### 本地部署

```bash
# 安装依赖
pip install -r requirements.txt

# 启动服务
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Docker部署

```bash
# 构建镜像
docker build -t ai-bookmark .

# 运行容器
docker run -d -p 8000:8000 ai-bookmark
```

## 技术架构

- **后端**: FastAPI
- **前端**: 纯HTML/CSS/JS
- **AI服务**: OpenAI API
- **数据库**: SQLite (可扩展至其他数据库)

## 贡献

欢迎提交Issue和Pull Request来改进项目。

## 许可证

[MIT License](LICENSE)