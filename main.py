# main.py
import os
import json
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv

from ai.analyze import analyze_text, analyze_wechat_article
from ai.cache import get_or_analyze_article

load_dotenv()

app = FastAPI(title="AI 收藏夹服务", version="0.2")

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
