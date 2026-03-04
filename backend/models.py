"""
FastAPI 数据库模型
使用 SQLAlchemy 2.0 异步支持
"""

from sqlalchemy import Column, String, Text, Boolean, DateTime, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship, Mapped, mapped_column, declarative_base
from datetime import datetime, timedelta
from typing import Optional, List
import bcrypt

Base = declarative_base()


class User(Base):
    """用户模型"""
    __tablename__ = 'users'
    
    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    wechat_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # 关系
    collections = relationship('Collection', back_populates='user', cascade='all, delete-orphan')
    weekly_reports = relationship('WeeklyReport', back_populates='user', cascade='all, delete-orphan')
    weekly_favorites = relationship('WeeklyFavorite', back_populates='user', cascade='all, delete-orphan')
    
    def set_password(self, password: str):
        """Hash and set password"""
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password: str) -> bool:
        """Verify password"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'username': self.username,
            'wechat_id': self.wechat_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Collection(Base):
    """收藏内容模型"""
    __tablename__ = 'collections'
    
    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(50), ForeignKey('users.id'), nullable=False, index=True)
    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    keywords: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    source_app: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    source_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    favorite_tags: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    
    # 关系
    user = relationship('User', back_populates='collections')
    favorites = relationship('WeeklyFavorite', back_populates='collection')
    
    def to_dict(self, include_text: bool = False) -> dict:
        result = {
            'id': self.id,
            'keywords': self.keywords or [],
            'category': self.category,
            'source_app': self.source_app,
            'source_url': self.source_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_favorite': self.is_favorite,
            'favorite_tags': self.favorite_tags or []
        }
        if include_text:
            result['original_text'] = self.original_text
        return result
    
    def should_expire(self) -> bool:
        """检查是否应该过期（1 年保存期限）"""
        if not self.created_at:
            return False
        expiration_date = self.created_at + timedelta(days=365)
        return datetime.utcnow() > expiration_date


class WeeklyReport(Base):
    """周报模型"""
    __tablename__ = 'weekly_reports'
    
    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(50), ForeignKey('users.id'), nullable=False, index=True)
    week_start: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    week_end: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    report_data: Mapped[dict] = mapped_column(JSON, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    
    # 关系
    user = relationship('User', back_populates='weekly_reports')
    favorites = relationship('WeeklyFavorite', back_populates='weekly_report')
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'user_id': self.user_id,
            'week_start': self.week_start.isoformat() if self.week_start else None,
            'week_end': self.week_end.isoformat() if self.week_end else None,
            'report_data': self.report_data,
            'generated_at': self.generated_at.isoformat() if self.generated_at else None,
            'is_archived': self.is_archived
        }


class WeeklyFavorite(Base):
    """周报收藏内容模型"""
    __tablename__ = 'weekly_favorites'
    
    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(50), ForeignKey('users.id'), nullable=False, index=True)
    collection_id: Mapped[str] = mapped_column(String(50), ForeignKey('collections.id'), nullable=False, index=True)
    weekly_report_id: Mapped[Optional[str]] = mapped_column(String(50), ForeignKey('weekly_reports.id'), nullable=True, index=True)
    keywords: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    favorite_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    
    # 关系
    user = relationship('User', back_populates='weekly_favorites')
    collection = relationship('Collection', back_populates='favorites')
    weekly_report = relationship('WeeklyReport', back_populates='favorites')
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.expires_at:
            self.expires_at = datetime.utcnow() + timedelta(days=365)
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'user_id': self.user_id,
            'collection_id': self.collection_id,
            'weekly_report_id': self.weekly_report_id,
            'keywords': self.keywords or [],
            'favorite_note': self.favorite_note,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }
    
    def is_expired(self) -> bool:
        """检查是否已过期"""
        if not self.expires_at:
            return True
        return datetime.utcnow() > self.expires_at


class KeywordIndex(Base):
    """关键词索引模型，用于快速搜索"""
    __tablename__ = 'keyword_indices'
    
    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    keyword: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(50), ForeignKey('users.id'), nullable=False, index=True)
    collection_ids: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    weekly_report_ids: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'keyword': self.keyword,
            'user_id': self.user_id,
            'collection_ids': self.collection_ids or [],
            'weekly_report_ids': self.weekly_report_ids or [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
