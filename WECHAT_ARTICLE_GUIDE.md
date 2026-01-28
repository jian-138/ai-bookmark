# 公众号文章收藏功能实现指南

**功能目标**: 实现通过微信机器人收藏公众号文章，并进行AI智能分析和分类

---

## 📱 前端需要做什么

### Android移动端

#### 1. 文章收藏入口
**需要实现**:
- 从微信分享的文章链接接收功能
- 支持直接粘贴公众号文章URL
- 文章预览界面（显示标题、封面、描述）

**代码位置**: `app/src/main/java/com/example/aicollector/`
- 创建 `ArticleCollectScreen.kt`（文章收藏界面）
- 在 `MainActivity.kt` 中添加分享接收处理

**所需数据**:
```kotlin
data class WeChatArticle(
    val title: String,          // 文章标题
    val url: String,            // 文章链接
    val description: String,    // 文章描述
    val coverImage: String?,    // 封面图片URL
    val author: String?         // 公众号名称
)
```

#### 2. 文章内容提取
**需要实现**:
- 调用后端文章解析接口
- 显示提取的正文内容
- 用户确认或编辑内容后提交

**API调用**:
```kotlin
// 解析文章接口
suspend fun parseWeChatArticle(url: String): ArticleContent {
    return apiService.parseArticle(url)
}

// 提交收藏接口
suspend fun collectArticle(article: WeChatArticle, content: String) {
    apiService.submitCollection(
        CollectionRequest(
            user_id = userId,
            original_text = content,
            url = article.url,
            metadata = mapOf(
                "title" to article.title,
                "source" to "wechat_official"
            )
        )
    )
}
```

#### 3. 收藏列表展示
**需要实现**:
- 区分普通文本收藏和公众号文章收藏
- 显示文章标题、封面图、公众号名称
- 点击跳转到文章详情或原文链接

**UI组件**:
```kotlin
@Composable
fun WeChatArticleItem(article: CollectionItem) {
    Card {
        Row {
            // 封面图
            AsyncImage(url = article.coverImage)
            
            Column {
                Text(article.title)           // 标题
                Text(article.author)          // 公众号
                Row {
                    article.ai_keywords.forEach { keyword ->
                        Chip(text = keyword)  // AI标签
                    }
                }
                Text(article.summary)         // AI摘要
            }
        }
    }
}
```

---

## 🖥️ 后端需要做什么

### FastAPI服务端

#### 1. 文章解析接口
**需要实现**:
- 接收公众号文章URL
- 爬取文章内容（标题、正文、作者、发布时间）
- 清洗HTML，提取纯文本

**代码位置**: `main.py`

**新增接口**:
```python
from pydantic import BaseModel, HttpUrl
from bs4 import BeautifulSoup
import requests

class ArticleParseRequest(BaseModel):
    url: HttpUrl

class ArticleParseResponse(BaseModel):
    success: bool
    title: str
    content: str          # 提取的正文
    author: str
    publish_time: str
    cover_image: Optional[str]
    error: Optional[str]

@app.post("/api/v1/article/parse", response_model=ArticleParseResponse)
async def parse_wechat_article(req: ArticleParseRequest):
    """
    解析微信公众号文章
    支持URL格式: mp.weixin.qq.com
    """
    try:
        # 1. 请求文章页面
        headers = {
            'User-Agent': 'Mozilla/5.0 ...'
        }
        response = requests.get(str(req.url), headers=headers, timeout=10)
        response.encoding = 'utf-8'
        
        # 2. 解析HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 3. 提取关键信息
        title = soup.find('h1', id='activity-name').text.strip()
        author = soup.find('a', id='js_name').text.strip()
        publish_time = soup.find('em', id='publish_time').text.strip()
        
        # 4. 提取正文（移除样式和脚本）
        content_div = soup.find('div', id='js_content')
        for script in content_div.find_all(['script', 'style']):
            script.decompose()
        content = content_div.get_text(separator='\n', strip=True)
        
        # 5. 提取封面图
        cover_image = None
        msg_cdn = soup.find('img', class_='rich_pages')
        if msg_cdn:
            cover_image = msg_cdn.get('data-src')
        
        return ArticleParseResponse(
            success=True,
            title=title,
            content=content,
            author=author,
            publish_time=publish_time,
            cover_image=cover_image
        )
        
    except Exception as e:
        return ArticleParseResponse(
            success=False,
            title="",
            content="",
            author="",
            publish_time="",
            error=str(e)
        )
```

#### 2. 收藏接口增强
**需要修改**: 现有的 `/api/v1/collect` 接口

**新增字段**:
```python
class CollectionRequest(BaseModel):
    user_id: str
    original_text: str
    url: Optional[str] = None
    metadata: Optional[dict] = None  # 新增：存储文章元信息

# metadata 结构示例:
{
    "title": "文章标题",
    "source": "wechat_official",  # 来源标识
    "author": "公众号名称",
    "publish_time": "2026-01-28",
    "cover_image": "https://..."
}
```

**修改存储逻辑**:
```python
@app.post("/api/v1/collect", response_model=CollectionResponse, status_code=201)
async def submit_collection(req: CollectionRequest, authorization: Optional[str] = Header(None)):
    # ... 现有逻辑
    
    collection_item = {
        "collect_id": collect_id,
        "user_id": req.user_id,
        "original_text": req.original_text,
        "url": req.url,
        "metadata": req.metadata,  # 保存元信息
        "ai_keywords": keywords,   # AI提取的关键词
        "ai_category": category,
        "summary": summary,
        "ai_confidence": confidence,
        "status": "ANALYZED",
        "created_at": created_at,
        "updated_at": updated_at
    }
    
    collections_storage.insert(0, collection_item)
    # TODO: 保存到数据库时，metadata可存为JSON字段
```

#### 3. 依赖安装
**需要添加**: `requirements.txt`

```txt
beautifulsoup4==4.12.2
lxml==4.9.3
requests==2.31.0
```

---

## 🤖 算法需要做什么

### AI分析模块

#### 1. 文章内容预处理
**需要实现**:
- 文章正文过长时的智能截断（保留关键段落）
- 移除广告和无关内容
- 保留核心观点和结论

**代码位置**: 创建 `ai_processor.py`

```python
def preprocess_article_content(content: str, max_length: int = 3000) -> str:
    """
    预处理文章内容，适配AI分析
    """
    # 1. 移除常见广告关键词
    ad_keywords = ['点击关注', '长按识别', '扫码关注', '往期推荐']
    lines = content.split('\n')
    cleaned_lines = [
        line for line in lines 
        if not any(kw in line for kw in ad_keywords)
    ]
    content = '\n'.join(cleaned_lines)
    
    # 2. 智能截断（保留开头和结尾）
    if len(content) > max_length:
        head_length = int(max_length * 0.6)
        tail_length = int(max_length * 0.4)
        content = content[:head_length] + '\n...\n' + content[-tail_length:]
    
    return content.strip()
```

#### 2. 公众号文章专属分析
**需要实现**:
- 识别文章类型（技术、资讯、观点、教程等）
- 提取文章主题和核心观点
- 生成结构化摘要

**SiliconFlow API调用优化**:
```python
async def analyze_wechat_article(content: str, title: str) -> AnalyzeResponse:
    """
    专门分析公众号文章
    """
    # 1. 预处理内容
    processed_content = preprocess_article_content(content)
    
    # 2. 构建提示词
    prompt = f"""
请分析以下微信公众号文章，提取关键信息：

标题：{title}
正文：{processed_content}

请提供：
1. 5个核心关键词
2. 文章分类（最多2个）
3. 100字以内的摘要（包含核心观点）
4. 文章类型（技术/资讯/观点/教程/其他）

返回JSON格式。
"""
    
    # 3. 调用SiliconFlow API
    response = await call_siliconflow_api(prompt)
    
    # 4. 解析结果
    return AnalyzeResponse(
        success=True,
        keywords=response['keywords'],
        category=response['category'],
        summary=response['summary'],
        article_type=response['article_type'],
        confidence=response['confidence']
    )
```

#### 3. 关键词优化
**针对公众号文章的特点**:
- 过滤通用词（"文章"、"内容"、"分享"等）
- 提取专业术语和行业词汇
- 识别热点话题和趋势

```python
def optimize_keywords_for_article(keywords: List[str]) -> List[str]:
    """
    优化公众号文章关键词
    """
    # 停用词列表
    stopwords = {'文章', '内容', '分享', '推荐', '关注', '精彩'}
    
    # 过滤停用词
    filtered = [kw for kw in keywords if kw not in stopwords]
    
    # 按重要性排序（根据词频、位置等）
    # TODO: 实现更复杂的排序算法
    
    return filtered[:5]  # 返回前5个
```

#### 4. AI分析结果缓存
**需要实现**:
- 相同URL的文章不重复分析
- 缓存分析结果（24小时有效）
- 减少API调用成本

```python
# 使用Redis或内存缓存
article_analysis_cache = {}

async def get_or_analyze_article(url: str, content: str, title: str):
    """
    带缓存的文章分析
    """
    # 检查缓存
    if url in article_analysis_cache:
        cached = article_analysis_cache[url]
        if cached['timestamp'] > time.time() - 86400:  # 24小时
            return cached['result']
    
    # 执行分析
    result = await analyze_wechat_article(content, title)
    
    # 保存缓存
    article_analysis_cache[url] = {
        'result': result,
        'timestamp': time.time()
    }
    
    return result
```

---

## 🔄 完整流程

### 用户操作流程
```
1. 用户在微信中看到公众号文章
   ↓
2. 分享/复制文章链接
   ↓
3. 打开AI书签App，粘贴链接
   ↓
4. 【前端】调用后端解析接口
   ↓
5. 【后端】爬取文章内容并返回
   ↓
6. 【前端】展示文章预览，用户确认
   ↓
7. 【前端】提交收藏请求
   ↓
8. 【后端】调用AI分析模块
   ↓
9. 【算法】预处理 → SiliconFlow分析 → 返回结果
   ↓
10. 【后端】保存收藏记录
   ↓
11. 【前端】显示收藏成功，展示AI分析结果
```

### 微信机器人自动收藏流程
```
1. 用户在微信中分享公众号文章给机器人
   ↓
2. 【bot-integrated.js】接收URL消息
   ↓
3. 提取文章链接（mp.weixin.qq.com）
   ↓
4. 调用后端 /api/v1/article/parse
   ↓
5. 【后端】解析文章内容
   ↓
6. 【bot】自动提交到 /api/v1/collect
   ↓
7. 【算法】AI分析
   ↓
8. 【bot】回复用户：收藏成功 + AI标签
```

---

## 📋 开发任务清单

### 前端任务（Android）
- [ ] 创建文章收藏界面UI
- [ ] 实现URL粘贴和验证
- [ ] 调用文章解析API
- [ ] 显示文章预览（标题、封面、正文）
- [ ] 提交收藏功能
- [ ] 收藏列表区分普通文本和文章
- [ ] 文章卡片UI设计

**预估工作量**: 2-3天

### 后端任务
- [ ] 实现 `/api/v1/article/parse` 接口
- [ ] 安装和配置BeautifulSoup
- [ ] HTML解析和内容提取
- [ ] 修改 `/api/v1/collect` 支持metadata
- [ ] 集成AI分析模块
- [ ] 实现分析结果缓存
- [ ] 错误处理和日志记录

**预估工作量**: 2-3天

### 算法任务
- [ ] 实现文章内容预处理函数
- [ ] 优化SiliconFlow API提示词
- [ ] 实现公众号文章专属分析逻辑
- [ ] 关键词过滤和优化
- [ ] 分析结果缓存机制
- [ ] 调试和质量评估

**预估工作量**: 1-2天

### 微信机器人任务
- [ ] 识别公众号文章链接格式
- [ ] 调用文章解析接口
- [ ] 自动提交收藏
- [ ] 回复用户分析结果

**预估工作量**: 0.5天

---

## 🧪 测试要点

### 前端测试
- 输入有效的公众号文章URL能正常解析
- 文章预览显示完整
- 封面图片正常加载
- 提交收藏成功
- 收藏列表正确展示文章卡片

### 后端测试
- 不同格式的公众号链接都能解析
- HTML解析准确，无乱码
- 超长文章能正确截断
- API响应时间 < 5秒
- 错误处理完善（网络超时、解析失败等）

### 算法测试
- 关键词提取准确（专业词汇优先）
- 分类结果合理
- 摘要简洁且包含核心观点
- 不同类型文章都能正确分析
- 缓存机制生效

---

**文档维护**: AI助手  
**最后更新**: 2026-01-28
