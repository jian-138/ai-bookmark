"""
周报收藏和关键词搜索 API 路由
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from datetime import datetime

from models import (
    WeeklyFavoriteRequest,
    WeeklyFavoriteResponse,
    WeeklyFavoriteListResponse,
    KeywordSearchRequest,
    KeywordSearchResponse,
    KeywordListResponse
)
from backend.app.services.weekly_favorite_service import WeeklyFavoriteService
from backend.app.services.keyword_search_service import KeywordSearchService

router = APIRouter()

# 初始化服务
favorite_service = WeeklyFavoriteService()
search_service = KeywordSearchService()


@router.post("/api/v1/weekly/favorites", response_model=WeeklyFavoriteResponse)
async def add_weekly_favorite(request: WeeklyFavoriteRequest):
    """
    添加周报收藏
    
    - **user_id**: 用户 ID
    - **collection_id**: 收藏内容 ID
    - **keywords**: 关联的关键词列表
    - **weekly_report_id**: 关联的周报 ID（可选）
    - **favorite_note**: 收藏备注（可选）
    """
    try:
        favorite = favorite_service.add_favorite(
            user_id=request.user_id,
            collection_id=request.collection_id,
            keywords=request.keywords,
            weekly_report_id=request.weekly_report_id,
            favorite_note=request.favorite_note
        )
        
        return WeeklyFavoriteResponse(
            success=True,
            message="收藏成功",
            favorite_id=favorite.id,
            favorite_data=favorite.to_dict()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"添加收藏失败：{str(e)}")


@router.delete("/api/v1/weekly/favorites/{favorite_id}", response_model=WeeklyFavoriteResponse)
async def remove_weekly_favorite(favorite_id: str, user_id: str):
    """
    移除周报收藏
    
    - **favorite_id**: 收藏 ID
    - **user_id**: 用户 ID
    """
    try:
        success = favorite_service.remove_favorite(favorite_id, user_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="收藏不存在")
        
        return WeeklyFavoriteResponse(
            success=True,
            message="取消收藏成功",
            favorite_id=favorite_id
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"取消收藏失败：{str(e)}")


@router.get("/api/v1/weekly/favorites", response_model=WeeklyFavoriteListResponse)
async def get_weekly_favorites(
    user_id: str,
    keyword: Optional[str] = Query(None, description="按关键词筛选"),
    weekly_report_id: Optional[str] = Query(None, description="按周报 ID 筛选"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量")
):
    """
    获取用户收藏列表
    
    - **user_id**: 用户 ID
    - **keyword**: 按关键词筛选（可选）
    - **weekly_report_id**: 按周报 ID 筛选（可选）
    - **page**: 页码
    - **page_size**: 每页数量
    """
    try:
        result = favorite_service.get_user_favorites(
            user_id=user_id,
            keyword=keyword,
            weekly_report_id=weekly_report_id,
            page=page,
            page_size=page_size
        )
        
        return WeeklyFavoriteListResponse(
            success=True,
            items=result['items'],
            total=result['total'],
            page=result['page'],
            page_size=result['page_size']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取收藏列表失败：{str(e)}")


@router.post("/api/v1/weekly/keywords/search", response_model=KeywordSearchResponse)
async def search_by_keyword(request: KeywordSearchRequest):
    """
    根据关键词搜索收藏内容
    
    - **user_id**: 用户 ID
    - **keyword**: 搜索关键词
    - **exact_match**: 是否精确匹配（默认 False，支持模糊搜索）
    - **favorites_only**: 是否只搜索收藏内容（默认 False）
    - **page**: 页码
    - **page_size**: 每页数量
    """
    try:
        result = search_service.search_by_keyword(
            user_id=request.user_id,
            keyword=request.keyword,
            exact_match=request.exact_match,
            include_favorites_only=request.favorites_only,
            page=request.page,
            page_size=request.page_size
        )
        
        return KeywordSearchResponse(
            success=True,
            items=result['items'],
            total=result['total'],
            page=result['page'],
            page_size=result['page_size'],
            keyword=result['keyword'],
            match_type=result['match_type']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜索失败：{str(e)}")


@router.get("/api/v1/weekly/keywords", response_model=KeywordListResponse)
async def get_all_keywords(user_id: str):
    """
    获取用户的所有关键词
    
    - **user_id**: 用户 ID
    """
    try:
        keywords = search_service.get_all_keywords(user_id)
        
        return KeywordListResponse(
            success=True,
            keywords=keywords,
            total=len(keywords)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取关键词失败：{str(e)}")


@router.get("/api/v1/weekly/keywords/statistics", response_model=dict)
async def get_keyword_statistics(user_id: str):
    """
    获取关键词统计信息
    
    - **user_id**: 用户 ID
    """
    try:
        stats = search_service.get_keyword_statistics(user_id)
        
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取统计信息失败：{str(e)}")


@router.get("/api/v1/weekly/reports/search")
async def search_weekly_reports(
    user_id: str,
    keyword: str
):
    """
    搜索包含关键词的周报
    
    - **user_id**: 用户 ID
    - **keyword**: 关键词
    """
    try:
        reports = search_service.search_weekly_reports(user_id, keyword)
        
        return {
            "success": True,
            "reports": reports,
            "total": len(reports)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜索周报失败：{str(e)}")
