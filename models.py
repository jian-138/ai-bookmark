from pydantic import BaseModel
from typing import Optional, List


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    message: str
    user_id: Optional[str] = None
    token: Optional[str] = None


class CollectionRequest(BaseModel):
    user_id: str
    original_text: Optional[str] = None
    title: Optional[str] = None
    source_url: Optional[str] = None


class CollectionResponse(BaseModel):
    success: bool
    message: str
    collection_id: Optional[str] = None


class CollectionListResponse(BaseModel):
    success: bool
    collections: List[dict]
    total: int


class CollectionDetail(BaseModel):
    success: bool
    collection: dict


class Metadata(BaseModel):
    user_id: str
    url: Optional[str] = None


class AnalyzeRequest(BaseModel):
    collect_id: str
    text: str
    metadata: Metadata


class AnalyzeResponse(BaseModel):
    success: bool
    keywords: Optional[List[str]] = None
    category: Optional[str] = None
    summary: Optional[str] = None
    confidence: Optional[float] = None
    article_type: Optional[str] = None
    error: Optional[str] = None


# ========== 周报功能相关模型 ==========

class WeeklyReportRequest(BaseModel):
    """周报生成请求"""
    user_id: str
    week_start: str  # 周开始日期 YYYY-MM-DD
    week_end: str    # 周结束日期 YYYY-MM-DD
    force_regenerate: bool = False  # 是否强制重新生成


class WeeklyReportSummary(BaseModel):
    """周报摘要"""
    total_collections: int
    categories: dict  # 分类统计 {category: count}
    top_keywords: List[str]
    weekly_trend: dict  # 每日收藏趋势
    reading_time_total: int  # 总阅读时间（分钟）


class WeeklyReportContent(BaseModel):
    """周报内容"""
    summary: WeeklyReportSummary
    category_analysis: List[dict]  # 分类详细分析
    top_collections: List[dict]    # 重要收藏内容
    keyword_cloud: List[dict]      # 关键词云数据
    time_distribution: dict        # 时间分布数据


class WeeklyReportResponse(BaseModel):
    """周报生成响应"""
    success: bool
    message: str
    report_id: Optional[str] = None
    report_data: Optional[WeeklyReportContent] = None
    generated_at: Optional[str] = None


class WeeklyReportListResponse(BaseModel):
    """周报列表响应"""
    success: bool
    message: str
    reports: List[dict]
    total: int
    current_week_report: Optional[dict] = None
    page: Optional[int] = 1
    size: Optional[int] = 10


class WeeklyReportDetailResponse(BaseModel):
    """周报详情响应"""
    success: bool
    report: dict
    collections: List[dict]  # 关联的收藏内容