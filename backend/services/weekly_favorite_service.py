"""
周报收藏服务 - FastAPI 异步版本
实现周报内容的收藏、存储和过期管理
"""

from datetime import datetime, timedelta
from typing import List, Optional
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload

from backend.models import WeeklyFavorite, Collection, KeywordIndex, WeeklyReport


class WeeklyFavoriteService:
    """周报收藏服务类"""
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
    
    async def add_favorite(
        self,
        user_id: str,
        collection_id: str,
        keywords: List[str],
        weekly_report_id: Optional[str] = None,
        favorite_note: Optional[str] = None
    ) -> WeeklyFavorite:
        """
        添加周报收藏
        
        Args:
            user_id: 用户 ID
            collection_id: 收藏内容 ID
            keywords: 关联的关键词列表
            weekly_report_id: 关联的周报 ID（可选）
            favorite_note: 收藏备注（可选）
            
        Returns:
            WeeklyFavorite: 创建的收藏对象
        """
        favorite_id = f"fav_{uuid.uuid4()}"
        
        favorite = WeeklyFavorite(
            id=favorite_id,
            user_id=user_id,
            collection_id=collection_id,
            weekly_report_id=weekly_report_id,
            keywords=keywords,
            favorite_note=favorite_note
        )
        
        self.db.add(favorite)
        await self.db.flush()  # 获取 ID
        
        # 更新收藏表标记
        result = await self.db.execute(
            select(Collection).where(Collection.id == collection_id)
        )
        collection = result.scalar_one_or_none()
        
        if collection:
            collection.is_favorite = True
            if not collection.favorite_tags:
                collection.favorite_tags = []
            collection.favorite_tags.extend(keywords)
        
        # 更新关键词索引
        await self._update_keyword_indices(
            user_id, keywords, collection_id, weekly_report_id
        )
        
        await self.db.commit()
        await self.db.refresh(favorite)
        return favorite
    
    async def remove_favorite(self, favorite_id: str, user_id: str) -> bool:
        """
        移除周报收藏
        
        Args:
            favorite_id: 收藏 ID
            user_id: 用户 ID
            
        Returns:
            bool: 是否成功移除
        """
        result = await self.db.execute(
            select(WeeklyFavorite).where(
                WeeklyFavorite.id == favorite_id,
                WeeklyFavorite.user_id == user_id
            )
        )
        favorite = result.scalar_one_or_none()
        
        if not favorite:
            return False
        
        # 更新收藏表标记
        collection_result = await self.db.execute(
            select(Collection).where(Collection.id == favorite.collection_id)
        )
        collection = collection_result.scalar_one_or_none()
        
        if collection:
            collection.is_favorite = False
            collection.favorite_tags = []
        
        # 从关键词索引中移除
        for keyword in favorite.keywords:
            await self._remove_from_keyword_index(
                user_id, keyword, favorite.collection_id
            )
        
        await self.db.delete(favorite)
        await self.db.commit()
        return True
    
    async def get_user_favorites(
        self,
        user_id: str,
        keyword: Optional[str] = None,
        weekly_report_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> dict:
        """
        获取用户收藏列表
        
        Returns:
            dict: 包含 items, total, page, page_size
        """
        # 构建查询
        query = select(WeeklyFavorite).where(
            WeeklyFavorite.user_id == user_id,
            WeeklyFavorite.expires_at > datetime.utcnow()
        )
        
        # 按关键词筛选
        if keyword:
            query = query.where(WeeklyFavorite.keywords.contains([keyword]))
        
        # 按周报 ID 筛选
        if weekly_report_id:
            query = query.where(WeeklyFavorite.weekly_report_id == weekly_report_id)
        
        # 获取总数
        count_query = select(WeeklyFavorite).select_from(WeeklyFavorite).where(
            WeeklyFavorite.user_id == user_id,
            WeeklyFavorite.expires_at > datetime.utcnow()
        )
        if keyword:
            count_query = count_query.where(WeeklyFavorite.keywords.contains([keyword]))
        if weekly_report_id:
            count_query = count_query.where(WeeklyFavorite.weekly_report_id == weekly_report_id)
        
        total_result = await self.db.execute(count_query)
        total = len(total_result.scalars().all())
        
        # 分页
        query = query.order_by(WeeklyFavorite.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)
        
        # 加载关联数据
        query = query.options(
            selectinload(WeeklyFavorite.collection),
            selectinload(WeeklyFavorite.weekly_report)
        )
        
        result = await self.db.execute(query)
        favorites = result.scalars().all()
        
        return {
            'items': [fav.to_dict() for fav in favorites],
            'total': total,
            'page': page,
            'page_size': page_size
        }
    
    async def _update_keyword_indices(
        self,
        user_id: str,
        keywords: List[str],
        collection_id: str,
        weekly_report_id: Optional[str] = None
    ):
        """更新关键词索引"""
        for keyword in keywords:
            # 查找现有索引
            result = await self.db.execute(
                select(KeywordIndex).where(
                    KeywordIndex.keyword == keyword,
                    KeywordIndex.user_id == user_id
                )
            )
            index = result.scalar_one_or_none()
            
            if not index:
                # 创建新索引
                index = KeywordIndex(
                    id=f"kw_{uuid.uuid4()}",
                    keyword=keyword,
                    user_id=user_id,
                    collection_ids=[collection_id],
                    weekly_report_ids=[weekly_report_id] if weekly_report_id else []
                )
                self.db.add(index)
            else:
                # 更新现有索引
                if collection_id not in index.collection_ids:
                    index.collection_ids.append(collection_id)
                if weekly_report_id and weekly_report_id not in index.weekly_report_ids:
                    index.weekly_report_ids.append(weekly_report_id)
                
                index.updated_at = datetime.utcnow()
        
        await self.db.flush()
    
    async def _remove_from_keyword_index(
        self,
        user_id: str,
        keyword: str,
        collection_id: str
    ):
        """从关键词索引中移除"""
        result = await self.db.execute(
            select(KeywordIndex).where(
                KeywordIndex.keyword == keyword,
                KeywordIndex.user_id == user_id
            )
        )
        index = result.scalar_one_or_none()
        
        if index:
            if collection_id in index.collection_ids:
                index.collection_ids.remove(collection_id)
            index.updated_at = datetime.utcnow()
            
            # 如果没有关联内容，删除索引
            if not index.collection_ids and not index.weekly_report_ids:
                await self.db.delete(index)
        
        await self.db.flush()
    
    async def cleanup_expired_favorites(self) -> int:
        """
        清理过期的收藏
        
        Returns:
            int: 清理的数量
        """
        now = datetime.utcnow()
        result = await self.db.execute(
            delete(WeeklyFavorite).where(WeeklyFavorite.expires_at < now)
        )
        await self.db.commit()
        return result.rowcount
