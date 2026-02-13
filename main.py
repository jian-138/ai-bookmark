# main.py
import os
import json
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional, List
from datetime import datetime
import uuid

from ai.analyze import analyze_text, analyze_wechat_article
from ai.cache import get_or_analyze_article
from routes.auth_routes import router as auth_router
from routes.collection_routes import router as collection_router
from routes.wechat_routes import router as wechat_router
# 延迟导入周报路由，避免循环依赖
from scheduler import start_scheduler

load_dotenv()

app = FastAPI(title="AI 收藏夹服务", version="0.2")

# 启动定时任务调度器
start_scheduler()

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
    title: Optional[str] = None
    source_url: Optional[str] = None

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
    data: List[CollectionItem]
    total: int
    page: int
    size: int

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

FALLBACK = {
    "success": True,
    "keywords": ["人工智能", "教育", "机器学习"],
    "category": "科技,教育",
    "summary": "AI 通过个性化路径提升教育效果。",
    "confidence": 0.91,
}

@app.post("/analyze", response_model=AnalyzeResponse)
async def local_analyze(req: AnalyzeRequest):
    return AnalyzeResponse(
        success=True,
        keywords=["人工智能", "教育"],
        category="科技,教育",
        summary="AI 通过个性化路径提升教育效果。",
        confidence=0.91,
        error=None
    )

@app.post("/internal/ai/analyze", response_model=AnalyzeResponse)
async def internal_analyze(req: AnalyzeRequest):
    print(">>> INTERNAL ANALYZE HIT")

    url = (req.metadata.url or "").strip()
    print("URL =", url)

    err = None
    raw_result = None

    try:
        # 选择分析函数
        if "mp.weixin.qq.com" in url:
            print("MODE = WECHAT ARTICLE")
            raw_result, err = get_or_analyze_article(
                url=url,
                content=req.text,
                title=req.collect_id,
                analyze_wechat_article=analyze_wechat_article
            )
        else:
            print("MODE = NORMAL TEXT")
            raw_result, err = analyze_text(req.text)

        print("RAW RESULT =", raw_result)

        # 强制防御：保证 result 是 dict
        if isinstance(raw_result, str):
            # 清理 ```json ``` 包裹
            raw_result = raw_result.strip()
            if raw_result.startswith("```"):
                raw_result = raw_result.strip("```").strip("json").strip()

            try:
                raw_result = json.loads(raw_result)
            except Exception as e:
                print("JSON PARSE FAILED:", e)
                raw_result = FALLBACK

        if not isinstance(raw_result, dict):
            raw_result = FALLBACK

        result = raw_result

    except Exception as e:
        print("INTERNAL ERROR:", e)
        return AnalyzeResponse(
            success=True,
            keywords=FALLBACK["keywords"],
            category=FALLBACK["category"],
            summary=FALLBACK["summary"],
            confidence=FALLBACK["confidence"],
            error=f"内部调用异常: {str(e)}"
        )

    # fallback 兜底
    if err:
        print("MODEL ERROR =", err)
        return AnalyzeResponse(
            success=True,
            keywords=result.get("keywords", FALLBACK["keywords"]),
            category=result.get("category", FALLBACK["category"]),
            summary=result.get("summary", FALLBACK["summary"]),
            confidence=result.get("confidence", FALLBACK["confidence"]),
            error=err
        )

    # 成功返回
    return AnalyzeResponse(
        success=True,
        keywords=result.get("keywords", FALLBACK["keywords"]),
        category=result.get("category", FALLBACK["category"]),
        summary=result.get("summary", FALLBACK["summary"]),
        confidence=result.get("confidence", FALLBACK["confidence"]),
        error=None
    )

@app.get("/")
def root():
    return {"message": "AI 收藏夹服务运行中"}

# --------- 内存存储（临时方案） ----------
collections_storage = []  # 临时存储收藏列表

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
    
    # 检查是否是网页收藏请求（有URL但无内容）
    if req.source_url and (not req.original_text or not req.original_text.strip() or len(req.original_text.strip()) < 10):
        print(f"检测到网页收藏请求，开始提取内容: {req.source_url}")
        
        # 尝试提取网页内容
        try:
            from web_content_extractor import extract_web_content
            success, web_content, error = extract_web_content(req.source_url)
            
            if success:
                # 使用提取的网页内容
                req.original_text = web_content['content']
                if not req.title:
                    req.title = web_content['title']
                print(f"网页内容提取成功: {web_content['title']} ({len(web_content['content'])}字)")
            else:
                raise HTTPException(status_code=400, detail=f"网页内容提取失败: {error}")
                
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"网页内容提取异常: {str(e)}")
    
    # 调试：检查接收到的文本内容
    print(f"接收到的原始文本: {repr(req.original_text)}")
    print(f"文本长度: {len(req.original_text)}")
    print(f"文本前50个字符: {req.original_text[:50]}")
    
    # 校验文本长度
    if len(req.original_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="TEXT_TOO_SHORT: 文本长度不足10个字符")
    
    # 生成收藏ID
    collect_id = "col_" + str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat() + "Z"
    updated_at = created_at
    
    # 初始状态为待分析
    status = "PENDING"
    ai_keywords = []
    ai_category = ""
    summary = ""
    ai_confidence = 0.0
    
    # 调用AI分析功能
    try:
        from ai.analyze import analyze_text
        
        print(f"开始AI分析，文本长度: {len(req.original_text)}")
        
        # 调用真正的AI分析
        analysis_result, error = analyze_text(req.original_text)
        
        print(f"AI分析结果: {analysis_result}")
        print(f"AI分析错误: {error}")
        
        if analysis_result and not error:
            # 使用AI分析结果
            ai_keywords = analysis_result.get("keywords", [])
            ai_category = analysis_result.get("category", "")
            summary = analysis_result.get("summary", "")
            ai_confidence = analysis_result.get("confidence", 0.85)
            status = "ANALYZED"
            print(f"AI分析成功: 关键词={ai_keywords}, 分类={ai_category}")
        else:
            # AI分析失败，使用默认值
            ai_keywords = ["待分析"]
            ai_category = "未分类"
            summary = req.original_text[:50] + "..."
            ai_confidence = 0.0
            status = "AI_FAILED"
            print("AI分析失败，使用默认值")
            
    except Exception as e:
        print(f"AI分析失败: {str(e)}")
        # 降级处理
        ai_keywords = ["分析失败"]
        ai_category = "未分类"
        summary = req.original_text[:50] + "..."
        ai_confidence = 0.0
        status = "AI_FAILED"
    
    # 创建收藏项
    collection_item = {
        "collect_id": collect_id,
        "user_id": req.user_id,
        "original_text": req.original_text,
        "url": req.source_url,
        "ai_keywords": ai_keywords,
        "ai_category": ai_category,
        "summary": summary,
        "ai_confidence": ai_confidence,
        "status": status,
        "created_at": created_at,
        "updated_at": updated_at
    }
    
    # 存储到内存
    collections_storage.insert(0, collection_item)  # 插入到列表开头
    
    return CollectionResponse(
        success=True,
        collect_id=collect_id,
        created_at=created_at,
        message="收藏成功，已提交 AI 分析"
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
    # 从内存中获取数据
    start = (page - 1) * size
    end = start + size
    page_items = collections_storage[start:end]
    
    return CollectionListResponse(
        success=True,
        data=page_items,
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
        data=[],
        total=0,
        page=1,
        size=20
    )

# 删除收藏
@app.delete("/api/v1/collections/{collect_id}")
async def delete_collection(collect_id: str, authorization: Optional[str] = Header(None)):
    """删除收藏"""
    # TODO: 从数据库删除
    return {"success": True, "message": "删除成功"}

# --------- 初始化收藏数据存储 ----------
collections_storage = []

# --------- 设置周报生成器的收藏数据存储 ----------
try:
    from weekly_report import weekly_report_generator
    weekly_report_generator.set_collections_storage(collections_storage)
except ImportError:
    print("警告: 周报生成器模块不可用")

# --------- 设置收藏路由的数据存储 ----------
# 将主程序的数据存储引用传递给路由模块
import routes.collection_routes
routes.collection_routes.collections_storage = collections_storage

# --------- 注册路由 ----------
app.include_router(auth_router)
app.include_router(collection_router)
app.include_router(wechat_router)

# 延迟导入并注册周报路由
from routes.weekly_report_routes import router as weekly_report_router
app.include_router(weekly_report_router)

# --------- 启动定时任务 ----------
start_scheduler()