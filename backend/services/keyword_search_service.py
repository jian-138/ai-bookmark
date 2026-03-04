"""
关键词搜索服务 - FastAPI 异步版本
实现高效的关键词检索算法，支持模糊搜索和精确匹配
"""

from typing import List, Dict, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from backend.models import Collection, KeywordIndex, WeeklyFavorite, WeeklyReport


class KeywordSearchService:
    """关键词搜索服务类"""
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
    
    async def search_by_keyword(
        self,
        user_id: str,
        keyword: str,
        exact_match: bool = False,
        include_favorites_only: bool = False,
        page: int = 1,
        page_size: int = 20
    ) -> Dict:
        """
        根据关键词搜索收藏内容
        
        Args:
            user_id: 用户 ID
            keyword: 搜索关键词
            exact_match: 是否精确匹配
            include_favorites_only: 是否只搜索收藏内容
            page: 页码
            page_size: 每页数量
            
        Returns:
            Dict: 搜索结果
        """
        if exact_match:
            return await self._exact_search(
                user_id, keyword, include_favorites_only, page, page_size
            )
        else:
            return await self._fuzzy_search(
                user_id, keyword, include_favorites_only, page, page_size
            )
    
    async def _exact_search(
        self,
        user_id: str,
        keyword: str,
        include_favorites_only: bool,
        page: int,
        page_size: int
    ) -> Dict:
        """精确搜索"""
        # 从关键词索引中查找
        result = await self.db.execute(
            select(KeywordIndex).where(
                KeywordIndex.keyword == keyword,
                KeywordIndex.user_id == user_id
            )
        )
        index = result.scalar_one_or_none()
        
        if not index:
            return {
                'items': [],
                'total': 0,
                'page': page,
                'page_size': page_size,
                'keyword': keyword,
                'match_type': 'exact'
            }
        
        collection_ids = index.collection_ids or []
        
        # 如果只搜索收藏内容
        if include_favorites_only:
            fav_result = await self.db.execute(
                select(WeeklyFavorite).where(
                    WeeklyFavorite.user_id == user_id,
                    WeeklyFavorite.collection_id.in_(collection_ids),
                    WeeklyFavorite.expires_at > datetime.utcnow()
                )
            )
            favorites = fav_result.scalars().all()
            collection_ids = [fav.collection_id for fav in favorites]
        
        # 获取收藏详情
        query = select(Collection).where(
            Collection.id.in_(collection_ids),
            Collection.user_id == user_id
        )
        
        total_result = await self.db.execute(query)
        total = len(total_result.scalars().all())
        
        # 分页
        query = query.order_by(Collection.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)
        
        result = await self.db.execute(query)
        collections = result.scalars().all()
        
        return {
            'items': [col.to_dict() for col in collections],
            'total': total,
            'page': page,
            'page_size': page_size,
            'keyword': keyword,
            'match_type': 'exact'
        }
    
    async def _fuzzy_search(
        self,
        user_id: str,
        keyword: str,
        include_favorites_only: bool,
        page: int,
        page_size: int
    ) -> Dict:
        """模糊搜索"""
        # 构建查询条件
        query = select(Collection).where(
            Collection.user_id == user_id,
            or_(
                Collection.original_text.ilike(f'%{keyword}%'),
                Collection.keywords.contains([keyword]),
                Collection.category.ilike(f'%{keyword}%')
            )
        )
        
        # 如果只搜索收藏内容
        if include_favorites_only:
            query = query.where(Collection.is_favorite == True)
        
        # 获取总数
        total_result = await self.db.execute(query)
        total = len(total_result.scalars().all())
        
        # 分页
        query = query.order_by(Collection.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)
        
        result = await self.db.execute(query)
        collections = result.scalars().all()
        
        return {
            'items': [col.to_dict() for col in collections],
            'total': total,
            'page': page,
            'page_size': page_size,
            'keyword': keyword,
            'match_type': 'fuzzy'
        }
    
    async def get_all_keywords(self, user_id: str) -> List[str]:
        """
        获取用户的所有关键词
        
        Args:
            user_id: 用户 ID
            
        Returns:
            List[str]: 关键词列表
        """
        result = await self.db.execute(
            select(KeywordIndex.keyword).where(
                KeywordIndex.user_id == user_id
            ).distinct()
        )
        return [row[0] for row in result.all()]
    
    async def get_keyword_statistics(self, user_id: str) -> Dict:
        """
        获取关键词统计信息
        
        Args:
            user_id: 用户 ID
            
        Returns:
            Dict: 统计信息
        """
        # 获取所有关键词索引
        result = await self.db.execute(
            select(KeywordIndex).where(
                KeywordIndex.user_id == user_id
            )
        )
        indices = result.scalars().all()
        
        # 统计每个关键词的收藏数量
        keyword_stats = {}
        for index in indices:
            keyword_stats[index.keyword] = len(index.collection_ids or [])
        
        # 排序
        sorted_keywords = sorted(
            keyword_stats.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        return {
            'total_keywords': len(indices),
            'total_collections': sum(len(idx.collection_ids or []) for idx in indices),
            'top_keywords': [
                {'keyword': kw, 'count': count}
                for kw, count in sorted_keywords[:20]
            ]
        }
