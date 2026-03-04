"""
周报收藏和关键词搜索 API 路由 - FastAPI 版本
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.services.weekly_favorite_service import WeeklyFavoriteService
from backend.services.keyword_search_service import KeywordSearchService
from models import (
    WeeklyFavoriteRequest,
    WeeklyFavoriteResponse,
    WeeklyFavoriteListResponse,
    FavoriteCollectionItem,
    KeywordSearchRequest,
    KeywordSearchResponse,
    KeywordListResponse
)

router = APIRouter(prefix="/api/v1/weekly", tags=["weekly-favorites"])


@router.post("/favorites", response_model=WeeklyFavoriteResponse)
async def add_weekly_favorite(
    request: WeeklyFavoriteRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    添加周报收藏
    
    - **user_id**: 用户 ID
    - **collection_id**: 收藏内容 ID
    - **keywords**: 关联的关键词列表
    - **weekly_report_id**: 关联的周报 ID（可选）
    - **favorite_note**: 收藏备注（可选）
    """
    try:
        service = WeeklyFavoriteService(db)
        favorite = await service.add_favorite(
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
            favorite_data=WeeklyFavoriteData(
                id=favorite.id,
                user_id=favorite.user_id,
                collection_id=favorite.collection_id,
                weekly_report_id=favorite.weekly_report_id,
                keywords=favorite.keywords,
                favorite_note=favorite.favorite_note,
                created_at=favorite.created_at.isoformat(),
                expires_at=favorite.expires_at.isoformat()
            )
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"添加收藏失败：{str(e)}")


@router.delete("/favorites/{favorite_id}", response_model=WeeklyFavoriteResponse)
async def remove_weekly_favorite(
    favorite_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    移除周报收藏
    
    - **favorite_id**: 收藏 ID
    - **user_id**: 用户 ID
    """
    try:
        service = WeeklyFavoriteService(db)
        success = await service.remove_favorite(favorite_id, user_id)
        
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


@router.get("/favorites", response_model=WeeklyFavoriteListResponse)
async def get_weekly_favorites(
    user_id: str,
    keyword: Optional[str] = Query(None, description="按关键词筛选"),
    weekly_report_id: Optional[str] = Query(None, description="按周报 ID 筛选"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    db: AsyncSession = Depends(get_db)
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
        service = WeeklyFavoriteService(db)
        result = await service.get_user_favorites(
            user_id=user_id,
            keyword=keyword,
            weekly_report_id=weekly_report_id,
            page=page,
            page_size=page_size
        )
        
        # 构建响应
        items = []
        for fav_data in result['items']:
            # 这里需要加载关联的 collection 数据
            # 简化处理，直接返回
            items.append(FavoriteCollectionItem(
                favorite=fav_data,
                collection={}  # 需要从数据库加载
            ))
        
        return WeeklyFavoriteListResponse(
            success=True,
            items=items,
            total=result['total'],
            page=result['page'],
            page_size=result['page_size']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取收藏列表失败：{str(e)}")


@router.post("/search", response_model=KeywordSearchResponse)
async def search_by_keyword(
    request: KeywordSearchRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    关键词搜索
    
    - **user_id**: 用户 ID
    - **keyword**: 搜索关键词
    - **exact_match**: 是否精确匹配
    - **favorites_only**: 是否只搜索收藏内容
    - **page**: 页码
    - **page_size**: 每页数量
    """
    try:
        service = KeywordSearchService(db)
        result = await service.search_by_keyword(
            user_id=request.user_id,
            keyword=request.keyword,
            exact_match=request.exact_match,
            include_favorites_only=request.favorites_only,
            page=request.page,
            page_size=request.page_size
        )
        
        items = [
            SearchCollectionItem(
                collection=col_data,
                match_type=result['match_type'],
                matched_keyword=request.keyword
            )
            for col_data in result['items']
        ]
        
        return KeywordSearchResponse(
            success=True,
            items=items,
            total=result['total'],
            page=result['page'],
            page_size=result['page_size'],
            keyword=result['keyword'],
            match_type=result['match_type']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜索失败：{str(e)}")


@router.get("/keywords", response_model=KeywordListResponse)
async def get_all_keywords(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    获取用户的所有关键词
    
    - **user_id**: 用户 ID
    """
    try:
        service = KeywordSearchService(db)
        keywords = await service.get_all_keywords(user_id)
        
        return KeywordListResponse(
            success=True,
            keywords=keywords,
            total=len(keywords)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取关键词失败：{str(e)}")


@router.get("/keywords/statistics")
async def get_keyword_statistics(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    获取关键词统计信息
    
    - **user_id**: 用户 ID
    """
    try:
        service = KeywordSearchService(db)
        stats = await service.get_keyword_statistics(user_id)
        return {"success": True, **stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取统计信息失败：{str(e)}")


# 需要导入 WeeklyFavoriteData
from models import WeeklyFavoriteData
