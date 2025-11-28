import os
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv

# 导入 DeepSeek 分析函数
from ai.analyze import analyze_text

# --------- 加载环境变量 ----------
load_dotenv()

# --------- FastAPI App ----------
app = FastAPI(title="AI 收藏夹服务", version="0.2")

# --------- 请求与响应模型 ----------
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

# --------- 根路径 ----------
@app.get("/")
def root():
    return {"message": "AI 收藏夹服务运行中"}
