# 后端启动指南

## 📋 前置条件

1. Python 3.11+ 已安装
2. pip 包管理器已安装

## 🚀 快速启动

### 1. 安装依赖

```bash
# 创建虚拟环境（推荐）
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 安装依赖包
pip install -r requirements.txt
```

### 2. 配置环境变量

创建 `.env` 文件（如果还没有）：

```env
# AI服务配置（可选）
SILICONFLOW_API_KEY=your_api_key_here
```

### 3. 启动后端服务

```bash
# 启动FastAPI服务器
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

服务将在以下地址运行：
- 本地访问: http://localhost:8000
- 局域网访问: http://你的IP:8000
- API文档: http://localhost:8000/docs

### 4. 测试接口

```bash
# 测试健康检查
python test_article_parse.py
```

## 📱 Android前端配置

### 修改NetworkModule.kt

找到文件：`app/src/main/java/com/example/aicollector/di/NetworkModule.kt`

修改BASE_URL：

```kotlin
private const val BASE_URL = "http://你的电脑IP:8000/"
// 例如: "http://192.168.1.100:8000/"
```

### 获取你的IP地址

**Windows:**
```bash
ipconfig
# 查找 "IPv4 地址"
```

**Linux/Mac:**
```bash
ifconfig
# 或
ip addr show
```

## 🧪 测试文章解析接口

### 使用curl测试

```bash
curl -X POST "http://localhost:8000/api/v1/article/parse" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://mp.weixin.qq.com/s/你的文章链接"}'
```

### 使用Python测试

修改 `test_article_parse.py` 中的 `TEST_URL`，然后运行：

```python
# 取消注释这一行
test_article_parse()
```

### 预期响应

```json
{
  "success": true,
  "title": "文章标题",
  "content": "文章正文内容...",
  "author": "公众号名称",
  "publish_time": "2026-01-28",
  "cover_image": "https://...",
  "error": null
}
```

## 🔧 已实现的API接口

### 1. 用户认证
- `POST /api/v1/auth/login` - 用户登录

### 2. 收藏管理
- `POST /api/v1/collect` - 提交收藏
- `GET /api/v1/collect/{collect_id}` - 查询单条收藏
- `GET /api/v1/collections` - 获取收藏列表
- `GET /api/v1/collections/search` - 搜索收藏
- `DELETE /api/v1/collections/{collect_id}` - 删除收藏

### 3. 文章解析（新增）✨
- `POST /api/v1/article/parse` - 解析微信公众号文章

## 📝 新增依赖说明

已添加到 `requirements.txt`：
- `beautifulsoup4==4.12.2` - HTML解析
- `lxml==4.9.3` - XML/HTML解析器

## ⚠️ 注意事项

### 1. 网络访问
- 确保防火墙允许8000端口
- Android设备和电脑需要在同一局域网

### 2. 微信文章限制
- 某些文章可能有访问限制
- 需要有效的User-Agent
- 部分内容可能需要登录才能查看

### 3. 性能优化
- 文章解析可能需要3-10秒
- 建议实现缓存机制（前端已实现）
- 考虑添加请求队列避免并发过多

## 🐛 常见问题

### Q1: 启动失败，提示模块未找到
```bash
# 确保已安装所有依赖
pip install -r requirements.txt
```

### Q2: Android无法连接后端
- 检查IP地址是否正确
- 检查防火墙设置
- 确认在同一WiFi网络

### Q3: 文章解析失败
- 检查URL格式是否正确
- 确认网络连接正常
- 查看后端日志获取详细错误

## 📊 下一步优化

- [ ] 添加数据库持久化（目前只有内存存储）
- [ ] 实现文章解析缓存
- [ ] 添加用户注册功能
- [ ] 集成AI分析功能
- [ ] 添加请求限流
- [ ] 完善错误处理和日志

## 🔗 相关文档

- API文档: http://localhost:8000/docs
- 项目总结: PROJECT_SUMMARY.md
- 微信文章指南: WECHAT_ARTICLE_GUIDE.md
