# main.py
import os
import json
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from dotenv import load_dotenv
from typing import Optional, List
from datetime import datetime
import uuid
import requests
from bs4 import BeautifulSoup

# 导入 DeepSeek 分析函数
from ai.analyze import analyze_text

# --------- 加载环境变量 ----------
load_dotenv()

# --------- FastAPI App ----------
app = FastAPI(title="AI 收藏夹服务", version="0.2")

# --------- CORS 配置 ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------- 请求与响应模型 ----------
# 用户认证
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    user_id: Optional[str] = None
    message: Optional[str] = None

# 收藏相关
class CollectionRequest(BaseModel):
    user_id: str
    original_text: str
    url: Optional[str] = None
    metadata: Optional[dict] = None  # 添加metadata字段

class CollectionResponse(BaseModel):
    success: bool
    collect_id: str
    created_at: str
    message: str

class CollectionItem(BaseModel):
    collect_id: str
    user_id: str
    original_text: str
    url: Optional[str] = None
    ai_keywords: Optional[List[str]] = None
    ai_category: Optional[str] = None
    summary: Optional[str] = None
    ai_confidence: Optional[float] = None
    status: str
    created_at: str
    updated_at: str

class CollectionDetailResponse(BaseModel):
    success: bool
    data: Optional[CollectionItem] = None
    message: Optional[str] = None

class CollectionListResponse(BaseModel):
    success: bool
    items: List[CollectionItem]  # 改为items，匹配前端
    total: int
    page: int
    size: int

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

class Metadata(BaseModel):
    user_id: str
    url: str | None = None

class AnalyzeRequest(BaseModel):
    collect_id: str
    text: str
    metadata: Metadata

class AnalyzeResponse(BaseModel):
    success: bool
    keywords: list[str] | None = None
    category: str | None = None
    summary: str | None = None
    confidence: float | None = None
    error: str | None = None

# --------- 本地测试接口（固定返回） ----------
@app.post("/analyze", response_model=AnalyzeResponse)
async def local_analyze(req: AnalyzeRequest):
    return AnalyzeResponse(
        success=True,
        keywords=["人工智能", "教育"],
        category="科技,教育",
        summary="AI 通过个性化路径提升教育效果。",
        confidence=0.91,
    )

# --------- 正式接口（硅基流动） ----------
@app.post("/internal/ai/analyze", response_model=AnalyzeResponse)
async def internal_analyze(req: AnalyzeRequest):
    result, err = analyze_text(req.text)

    if err:
        # 兜底返回固定示例数据
        return AnalyzeResponse(
            success=True,
            keywords=["人工智能", "教育", "机器学习"],
            category="科技,教育",
            summary="AI 通过个性化路径提升教育效果。",
            confidence=0.91,
            error=err
        )

    return AnalyzeResponse(
        success=True,
        keywords=result.get("keywords"),
        category=result.get("category"),
        summary=result.get("summary"),
        confidence=result.get("confidence"),
    )

# --------- 内存存储（临时方案） ----------
collections_storage = []  # 存储收藏记录

# --------- 根路径 ----------
@app.get("/")
def root():
    return {"message": "AI 收藏夹服务运行中"}

# --------- 移动端 API ----------
# 用户登录
@app.post("/api/v1/auth/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    """用户登录接口（测试版）"""
    # TODO: 连接真实的用户认证系统
    if req.username == "test" and req.password == "test123":
        return LoginResponse(
            success=True,
            token="test_token_" + str(uuid.uuid4()),
            user_id="usr_" + str(uuid.uuid4()),
            message="登录成功"
        )
    else:
        raise HTTPException(status_code=401, detail="用户名或密码错误")

# 提交收藏
@app.post("/api/v1/collect", response_model=CollectionResponse, status_code=201)
async def submit_collection(req: CollectionRequest, authorization: Optional[str] = Header(None)):
    """提交收藏接口"""
    # 校验文本长度
    if len(req.original_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="TEXT_TOO_SHORT: 文本长度不足10个字符")
    
    # 生成收藏ID
    collect_id = "col_" + str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat() + "Z"
    
    # 保存到内存存储
    collection_item = {
        "collect_id": collect_id,
        "user_id": req.user_id,
        "original_text": req.original_text,
        "url": req.url,
        "metadata": req.metadata,  # 直接保存字典
        "ai_keywords": ["AI", "收藏"],  # TODO: 调用AI分析
        "ai_category": "未分类",
        "summary": req.original_text[:100],
        "ai_confidence": 0.0,
        "status": "PENDING",
        "created_at": created_at,
        "updated_at": created_at
    }
    collections_storage.insert(0, collection_item)  # 插入到开头，最新的在前面
    
    return CollectionResponse(
        success=True,
        collect_id=collect_id,
        created_at=created_at,
        message="收藏成功"
    )

# 查询单条收藏
@app.get("/api/v1/collect/{collect_id}", response_model=CollectionDetailResponse)
async def get_collection_detail(collect_id: str, authorization: Optional[str] = Header(None)):
    """查询单条收藏详情"""
    # TODO: 从数据库查询
    # 这里返回模拟数据
    mock_item = CollectionItem(
        collect_id=collect_id,
        user_id="usr_test",
        original_text="人工智能正在改变教育行业",
        url="https://example.com",
        ai_keywords=["AI", "教育"],
        ai_category="科技,教育",
        summary="AI推动个性化学习",
        ai_confidence=0.91,
        status="ANALYZED",
        created_at=datetime.utcnow().isoformat() + "Z",
        updated_at=datetime.utcnow().isoformat() + "Z"
    )
    
    return CollectionDetailResponse(
        success=True,
        data=mock_item,
        message="查询成功"
    )

# 获取收藏列表
@app.get("/api/v1/collections", response_model=CollectionListResponse)
async def get_collections(
    page: int = 1,
    size: int = 20,
    authorization: Optional[str] = Header(None)
):
    """获取收藏列表"""
    # 兼容从0开始的页码
    actual_page = page if page > 0 else 1
    start = (actual_page - 1) * size
    end = start + size
    items = collections_storage[start:end]
    
    # 转换为CollectionItem格式
    collection_items = [
        CollectionItem(
            collect_id=item["collect_id"],
            user_id=item["user_id"],
            original_text=item["original_text"],
            url=item.get("url"),
            ai_keywords=item.get("ai_keywords", []),
            ai_category=item.get("ai_category", "未分类"),
            summary=item.get("summary"),
            ai_confidence=item.get("ai_confidence", 0.0),
            status=item["status"],
            created_at=item["created_at"],
            updated_at=item["updated_at"]
        )
        for item in items
    ]
    
    return CollectionListResponse(
        success=True,
        items=collection_items,  # 改为items
        total=len(collections_storage),
        page=page,
        size=size
    )

# 搜索收藏
@app.get("/api/v1/collections/search", response_model=CollectionListResponse)
async def search_collections(
    query: str,
    category: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    """搜索收藏"""
    # TODO: 实现真实搜索逻辑
    return CollectionListResponse(
        success=True,
        items=[],  # 改为items
        total=0,
        page=1,
        size=20
    )

# 删除收藏
@app.delete("/api/v1/collections/{collect_id}")
async def delete_collection(collect_id: str, authorization: Optional[str] = Header(None)):
    """删除收藏"""
    global collections_storage
    collections_storage = [item for item in collections_storage if item["collect_id"] != collect_id]
    return {"success": True, "message": "删除成功"}

# 解析微信公众号文章
@app.post("/api/v1/article/parse", response_model=ArticleParseResponse)
async def parse_wechat_article(req: ArticleParseRequest):
    """
    解析微信公众号文章
    支持URL格式: mp.weixin.qq.com
    """
    try:
        url_str = str(req.url)
        
        # 验证是否为微信公众号链接
        if "mp.weixin.qq.com" not in url_str:
            return ArticleParseResponse(
                success=False,
                title="",
                content="",
                author="",
                publish_time="",
                error="仅支持微信公众号文章链接（mp.weixin.qq.com）"
            )
        
        # 1. 请求文章页面
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url_str, headers=headers, timeout=10)
        response.encoding = 'utf-8'
        
        if response.status_code != 200:
            return ArticleParseResponse(
                success=False,
                title="",
                content="",
                author="",
                publish_time="",
                error=f"无法访问文章页面，状态码：{response.status_code}"
            )
        
        # 2. 解析HTML（使用html.parser，不需要lxml）
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 3. 提取关键信息
        title_elem = soup.find('h1', id='activity-name')
        title = title_elem.text.strip() if title_elem else "未知标题"
        
        author_elem = soup.find('a', id='js_name')
        author = author_elem.text.strip() if author_elem else "未知作者"
        
        publish_time_elem = soup.find('em', id='publish_time')
        publish_time = publish_time_elem.text.strip() if publish_time_elem else ""
        
        # 4. 提取正文（移除样式和脚本）
        content_div = soup.find('div', id='js_content')
        if content_div:
            # 移除脚本和样式标签
            for script in content_div.find_all(['script', 'style']):
                script.decompose()
            content = content_div.get_text(separator='\n', strip=True)
        else:
            content = "无法提取文章内容"
        
        # 5. 提取封面图
        cover_image = None
        msg_cdn = soup.find('img', class_='rich_pages')
        if msg_cdn:
            cover_image = msg_cdn.get('data-src') or msg_cdn.get('src')
        
        # 如果没有找到封面图，尝试其他方式
        if not cover_image:
            first_img = soup.find('img')
            if first_img:
                cover_image = first_img.get('data-src') or first_img.get('src')
        
        return ArticleParseResponse(
            success=True,
            title=title,
            content=content,
            author=author,
            publish_time=publish_time,
            cover_image=cover_image
        )
        
    except requests.Timeout:
        return ArticleParseResponse(
            success=False,
            title="",
            content="",
            author="",
            publish_time="",
            error="请求超时，请检查网络连接"
        )
    except Exception as e:
        return ArticleParseResponse(
            success=False,
            title="",
            content="",
            author="",
            publish_time="",
            error=f"解析失败：{str(e)}"
        )

# --------- 初始化收藏数据存储 ----------
# 设置周报生成器的收藏数据存储
from weekly_report import weekly_report_generator
weekly_report_generator.set_collections_storage(collections_storage)

# --------- 设置收藏路由的数据存储 ----------
# 将主程序的数据存储引用传递给路由模块
import routes.collection_routes
routes.collection_routes.collections_storage = collections_storage

# --------- 注册路由 ----------
from routes.auth_routes import router as auth_router
from routes.collection_routes import router as collection_router
from routes.wechat_routes import router as wechat_router

app.include_router(auth_router)
app.include_router(collection_router)
app.include_router(wechat_router)

# 延迟导入并注册周报路由
from routes.weekly_report_routes import router as weekly_report_router
app.include_router(weekly_report_router)

# --------- 启动定时任务 ----------
from scheduler import start_scheduler
start_scheduler()