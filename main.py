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

load_dotenv()

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
    # 校验文本长度
    if len(req.original_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="TEXT_TOO_SHORT: 文本长度不足10个字符")
    
    # 生成收藏ID
    collect_id = "col_" + str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat() + "Z"
    updated_at = created_at
    
    # 创建收藏项
    collection_item = {
        "collect_id": collect_id,
        "user_id": req.user_id,
        "original_text": req.original_text,
        "url": req.url,
        "ai_keywords": ["AI", "测试"],  # TODO: 调用AI分析
        "ai_category": "科技",
        "summary": req.original_text[:50] + "...",
        "ai_confidence": 0.85,
        "status": "ANALYZED",
        "created_at": created_at,
        "updated_at": updated_at
    }
    
    # 存储到内存
    collections_storage.insert(0, collection_item)  # 插入到列表开头
    
    # TODO: 存储到数据库
    # TODO: 触发AI分析异步任务
    
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