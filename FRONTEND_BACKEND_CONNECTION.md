# 前后端对接指南

## 📊 当前状态

### ✅ 前端（Android）
- 所有UI界面已完成
- 数据模型已定义
- API接口已声明
- 目前使用MOCK模式测试

### ✅ 后端（FastAPI）
- 基础接口已实现
- **文章解析接口已添加** ✨
- 依赖包已更新

## 🔄 对接步骤

### 步骤1: 启动后端服务

```bash
# 1. 安装依赖（首次运行）
pip install -r requirements.txt

# 2. 启动服务
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

服务启动后会显示：
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### 步骤2: 获取你的IP地址

**Windows:**
```bash
ipconfig
```
找到 "IPv4 地址"，例如：`192.168.1.100`

**Linux/Mac:**
```bash
ifconfig | grep "inet "
```

### 步骤3: 修改Android配置

打开文件：`app/src/main/java/com/example/aicollector/di/NetworkModule.kt`

修改以下两处：

```kotlin
// 1. 关闭MOCK模式
private const val MOCK_API = false  // 改为 false

// 2. 修改BASE_URL为你的IP
private const val BASE_URL = "http://192.168.1.100:8000/"  // 替换为你的IP
```

### 步骤4: 编译并运行Android应用

```bash
# 在Android Studio中点击 Run 按钮
# 或使用命令行
./gradlew installDebug
```

### 步骤5: 测试功能

1. **测试文章收藏**
   - 打开应用
   - 粘贴微信公众号文章链接
   - 点击"解析文章"
   - 查看解析结果

2. **测试收藏列表**
   - 查看已收藏的文章
   - 点击文章查看详情

## 🔍 接口对照表

### 前端调用 → 后端实现

| 前端接口 | 后端路由 | 状态 | 说明 |
|---------|---------|------|------|
| `ApiService.login()` | `POST /api/v1/auth/login` | ✅ | 用户登录 |
| `ApiService.parseArticle()` | `POST /api/v1/article/parse` | ✅ | 解析文章（新增） |
| `ApiService.submitCollection()` | `POST /api/v1/collect` | ✅ | 提交收藏 |
| `ApiService.getCollections()` | `GET /api/v1/collections` | ✅ | 获取列表 |
| `ApiService.getCollectionDetail()` | `GET /api/v1/collect/{id}` | ✅ | 获取详情 |
| `ApiService.searchCollections()` | `GET /api/v1/collections/search` | ✅ | 搜索收藏 |
| `ApiService.deleteCollection()` | `DELETE /api/v1/collections/{id}` | ✅ | 删除收藏 |

## 📝 数据模型对照

### ArticleParseRequest/Response

**前端（Kotlin）:**
```kotlin
data class ArticleParseRequest(
    val url: String
)

data class ArticleParseResponse(
    val success: Boolean,
    val title: String,
    val content: String,
    val author: String,
    val publishTime: String,
    val coverImage: String?,
    val error: String?
)
```

**后端（Python）:**
```python
class ArticleParseRequest(BaseModel):
    url: HttpUrl

class ArticleParseResponse(BaseModel):
    success: bool
    title: str
    content: str
    author: str
    publish_time: str
    cover_image: Optional[str] = None
    error: Optional[str] = None
```

✅ **完全匹配！**（注意：Python使用snake_case，Kotlin使用camelCase，但Gson会自动转换）

## 🧪 测试用例

### 1. 测试文章解析

**测试URL示例：**
```
https://mp.weixin.qq.com/s/xxxxx
```

**预期流程：**
1. 前端发送URL到后端
2. 后端爬取文章内容
3. 返回标题、作者、正文等信息
4. 前端显示预览界面

### 2. 测试收藏提交

**预期流程：**
1. 用户确认文章信息
2. 前端提交收藏请求
3. 后端保存数据（目前是内存）
4. 返回收藏ID
5. 前端显示成功提示

### 3. 测试收藏列表

**预期流程：**
1. 前端请求收藏列表
2. 后端返回数据（目前是模拟数据）
3. 前端显示文章卡片

## ⚠️ 已知限制

### 后端限制
1. **无数据库** - 目前使用内存存储，重启后数据丢失
2. **无AI分析** - AI分析功能未完全集成
3. **无用户系统** - 登录接口是测试版本

### 文章解析限制
1. **仅支持微信公众号** - 其他平台暂不支持
2. **可能被限流** - 频繁请求可能被微信限制
3. **部分文章需登录** - 某些文章可能无法访问

## 🐛 调试技巧

### 查看后端日志
后端运行时会显示所有请求日志：
```
INFO:     127.0.0.1:52345 - "POST /api/v1/article/parse HTTP/1.1" 200 OK
```

### 查看Android日志
在Android Studio的Logcat中搜索：
```
OkHttp
```
可以看到所有网络请求和响应

### 使用Postman测试
```bash
POST http://192.168.1.100:8000/api/v1/article/parse
Content-Type: application/json

{
  "url": "https://mp.weixin.qq.com/s/xxxxx"
}
```

## 🚀 下一步优化

### 短期（本周）
- [ ] 添加数据库持久化（SQLite或PostgreSQL）
- [ ] 实现真实的用户认证
- [ ] 完善错误处理

### 中期（2周内）
- [ ] 集成AI分析功能
- [ ] 添加文章解析缓存
- [ ] 支持更多平台（知乎、简书等）

### 长期（1个月内）
- [ ] 部署到生产环境
- [ ] 性能优化
- [ ] 添加监控和日志

## 📞 遇到问题？

### 常见错误

**1. 连接失败 (Connection refused)**
- 检查后端是否启动
- 检查IP地址是否正确
- 检查防火墙设置

**2. 解析失败 (Parse error)**
- 检查URL格式
- 查看后端日志获取详细错误
- 尝试其他文章链接

**3. 超时 (Timeout)**
- 增加超时时间（NetworkModule中的TIMEOUT_SECONDS）
- 检查网络连接
- 文章内容过大可能需要更长时间

## 📚 相关文档

- [后端启动指南](BACKEND_STARTUP_GUIDE.md)
- [项目总结](PROJECT_SUMMARY.md)
- [微信文章指南](WECHAT_ARTICLE_GUIDE.md)
- [API文档](http://localhost:8000/docs)

---

**最后更新**: 2026-02-13
**维护者**: AI助手
