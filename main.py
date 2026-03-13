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
    message: str

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
        raise HTTPException(status_code=400, detail="TEXT_TOO_SHORT: 文本长度不足 10 个字符")
    
    # 生成收藏 ID
    collect_id = "col_" + str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat() + "Z"
    
    # 初始化 AI 分析结果
    ai_keywords = []
    ai_category = ""
    summary = req.original_text[:100]
    ai_confidence = 0.0
    status = "PENDING"
    
    # 调用 AI 分析
    try:
        from ai.analyze import analyze_text
        from utils import format_ai_analysis_result
        
        print(f"🔍 开始 AI 分析，文本长度：{len(req.original_text.strip())}")
        analysis_result, err = analyze_text(req.original_text.strip())
        
        if err:
            print(f"[ERROR] AI 分析失败：{err}")
            status = "AI_FAILED"
        elif analysis_result:
            print(f"[OK] AI 分析成功")
            formatted_analysis = format_ai_analysis_result(analysis_result)
            ai_keywords = formatted_analysis.get('keywords', [])
            ai_category = formatted_analysis.get('category', '')
            summary = formatted_analysis.get('summary', req.original_text[:100])
            ai_confidence = formatted_analysis.get('confidence', 0.0)
            status = "ANALYZED"
        else:
            print(f"[WARN] AI 分析返回空结果")
            status = "AI_FAILED"
    except Exception as e:
        print(f"[ERROR] AI 分析异常：{str(e)}")
        status = "AI_FAILED"
    
    # 保存到内存存储
    collection_item = {
        "id": collect_id,  # 添加 id 字段，与 collect_id 相同
        "collect_id": collect_id,
        "user_id": req.user_id,
        "original_text": req.original_text,
        "url": req.url,
        "metadata": req.metadata,  # 直接保存字典
        "ai_keywords": ai_keywords,
        "ai_category": ai_category,
        "summary": summary,
        "ai_confidence": ai_confidence,
        "status": status,
        "created_at": created_at,
        "updated_at": created_at
    }
    collections_storage.insert(0, collection_item)  # 插入到开头，最新的在前面
    
    return CollectionResponse(
        success=True,
        collect_id=collect_id,
        created_at=created_at,
        message="收藏成功！内容已提交 AI 分析"
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
    query: str,  # 必需的查询参数
    keyword: Optional[str] = None,  # 可选的 keyword 参数（兼容）
    category: Optional[str] = None,
    page: int = 1,
    size: int = 20,
    authorization: Optional[str] = Header(None)
):
    """搜索收藏 - 支持关键词搜索"""
    # 使用 keyword 参数，如果提供了的话；否则使用 query
    search_query = keyword or query
    
    if not search_query:
        return CollectionListResponse(
            success=True,
            items=[],
            total=0,
            page=page,
            size=size
        )
    
    # 在内存存储中搜索
    search_lower = search_query.lower()
    matched_items = []
    
    for item in collections_storage:
        # 搜索标题、内容、关键词、分类
        if (search_lower in item.get('original_text', '').lower() or
            search_lower in ' '.join(item.get('ai_keywords', [])).lower() or
            search_lower in item.get('ai_category', '').lower() or
            search_lower in item.get('url', '').lower()):
            matched_items.append(item)
    
    # 分页
    start = (page - 1) * size
    end = start + size
    items = matched_items[start:end]
    
    # 转换为 CollectionItem 格式
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
        items=collection_items,
        total=len(matched_items),
        page=page,
        size=size
    )

# 删除收藏
@app.delete("/api/v1/collections/{collect_id}")
async def delete_collection(collect_id: str, authorization: Optional[str] = Header(None)):
    """删除收藏"""
    global collections_storage
    collections_storage = [item for item in collections_storage if item["collect_id"] != collect_id]
    return {"success": True, "message": "删除成功"}

# 生成周报
class WeeklyReportRequest(BaseModel):
    user_id: str
    week_start: Optional[str] = None  # ISO 格式日期字符串
    week_end: Optional[str] = None

class WeeklyReportItem(BaseModel):
    report_id: str
    user_id: str
    week_start: str
    week_end: str
    total_count: int
    favorite_count: int
    top_keywords: List[str]
    top_categories: List[str]
    summary: str
    created_at: str

class WeeklyReportResponse(BaseModel):
    success: bool
    data: Optional[WeeklyReportItem] = None
    message: Optional[str] = None

# 内存存储周报
weekly_reports_storage = []

@app.post("/api/v1/weekly-report/generate", response_model=WeeklyReportResponse)
async def generate_weekly_report(req: WeeklyReportRequest):
    """生成本周周报"""
    from datetime import datetime, timedelta
    
    # 如果没有指定日期范围，使用本周
    if not req.week_start or not req.week_end:
        # 获取本周一和周日
        today = datetime.utcnow()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)
    else:
        week_start = datetime.fromisoformat(req.week_start.replace('Z', '+00:00'))
        week_end = datetime.fromisoformat(req.week_end.replace('Z', '+00:00'))
    
    # 筛选本周的收藏
    week_items = []
    for item in collections_storage:
        if item["user_id"] != req.user_id:
            continue
        
        try:
            created_at = datetime.fromisoformat(item["created_at"].replace('Z', '+00:00'))
            if week_start <= created_at <= week_end:
                week_items.append(item)
        except:
            # 如果日期解析失败，也包含进来
            week_items.append(item)
    
    # 统计关键词
    keyword_count = {}
    category_count = {}
    
    for item in week_items:
        # 统计关键词
        for kw in item.get('ai_keywords', []):
            keyword_count[kw] = keyword_count.get(kw, 0) + 1
        
        # 统计分类
        categories = item.get('ai_category', '').split(',')
        for cat in categories:
            cat = cat.strip()
            if cat:
                category_count[cat] = category_count.get(cat, 0) + 1
    
    # 获取 Top 5 关键词和分类
    top_keywords = sorted(keyword_count.items(), key=lambda x: x[1], reverse=True)[:5]
    top_categories = sorted(category_count.items(), key=lambda x: x[1], reverse=True)[:3]
    
    # 生成摘要
    summary = f"本周共收藏 {len(week_items)} 条内容"
    if top_keywords:
        summary += f"，主要关键词：{', '.join([kw[0] for kw in top_keywords[:3]])}"
    if top_categories:
        summary += f"，主要分类：{', '.join([cat[0] for cat in top_categories])}"
    summary += "。"
    
    # 生成周报
    report_id = "report_" + str(uuid.uuid4())
    report = WeeklyReportItem(
        report_id=report_id,
        user_id=req.user_id,
        week_start=week_start.isoformat() + "Z",
        week_end=week_end.isoformat() + "Z",
        total_count=len(week_items),
        favorite_count=len([i for i in week_items if i.get('status') == 'ANALYZED']),
        top_keywords=[kw[0] for kw in top_keywords],
        top_categories=[cat[0] for cat in top_categories],
        summary=summary,
        created_at=datetime.utcnow().isoformat() + "Z"
    )
    
    # 保存到内存存储
    weekly_reports_storage.append(report.dict())
    
    return WeeklyReportResponse(
        success=True,
        data=report,
        message="周报生成成功"
    )

@app.get("/api/v1/weekly-report/list", response_model=WeeklyReportResponse)
async def list_weekly_reports(
    user_id: str,
    page: int = 1,
    size: int = 10
):
    """获取周报列表"""
    # 筛选用户的周报
    user_reports = [r for r in weekly_reports_storage if r.get('user_id') == user_id]
    
    # 按时间倒序排序
    user_reports.sort(key=lambda x: x.get('week_end', ''), reverse=True)
    
    # 分页
    start = (page - 1) * size
    end = start + size
    reports = user_reports[start:end]
    
    return WeeklyReportResponse(
        success=True,
        data=reports[0] if reports else None,
        message=f"共 {len(user_reports)} 条周报"
    )

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

# 注册周报相关路由（FastAPI 版本）
from backend.routes.weekly_favorites import router as weekly_favorites_router
app.include_router(weekly_favorites_router)

# --------- 根路径和健康检查接口（必须在路由注册之后） ----------
@app.get("/")
def root():
    return {"message": "AI 收藏夹服务运行中"}

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "服务运行正常"}

# --------- 应用启动事件 ----------
@app.on_event("startup")
async def startup_event():
    """应用启动时初始化数据库"""
    try:
        from backend.database import init_db
        print("[INIT] 初始化数据库...")
        await init_db()
        print("[OK] 数据库初始化成功")
    except Exception as e:
        print(f"[WARN] 数据库初始化警告：{str(e)}")
    
    # 启动定时任务
    try:
        from scheduler import start_scheduler
        start_scheduler()
        print("[SCHEDULER] 定时任务调度器已启动")
    except Exception as e:
        print(f"[WARN] 定时任务启动警告：{str(e)}")

# --------- 应用关闭事件 ----------
@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时清理资源"""
    try:
        from backend.database import close_db
        await close_db()
        print("[BYE] 数据库连接已关闭")
    except Exception as e:
        print(f"[WARN] 清理资源警告：{str(e)}")

# --------- 启动 FastAPI 服务 ----------
if __name__ == "__main__":
    import uvicorn
    print("🚀 启动 AI 书签后端服务...")
    print(f"📡 服务地址：http://localhost:8000")
    print(f"📚 API 文档：http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)