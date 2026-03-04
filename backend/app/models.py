from datetime import datetime, timedelta
from app import db
import bcrypt


class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(50), primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    wechat_id = db.Column(db.String(100), unique=True, nullable=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    collections = db.relationship('Collection', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    weekly_reports = db.relationship('WeeklyReport', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    weekly_favorites = db.relationship('WeeklyFavorite', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        """Verify password"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'wechat_id': self.wechat_id,
            'created_at': self.created_at.isoformat()
        }


class Collection(db.Model):
    __tablename__ = 'collections'
    
    id = db.Column(db.String(50), primary_key=True)
    user_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False, index=True)
    original_text = db.Column(db.Text, nullable=False)
    keywords = db.Column(db.JSON, default=list)  # Array of keywords
    category = db.Column(db.String(50), nullable=True, index=True)
    source_app = db.Column(db.String(100), nullable=True)
    source_url = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    is_favorite = db.Column(db.Boolean, default=False, index=True)
    favorite_tags = db.Column(db.JSON, default=list)
    
    def to_dict(self, include_text=False):
        result = {
            'id': self.id,
            'keywords': self.keywords or [],
            'category': self.category,
            'source_app': self.source_app,
            'source_url': self.source_url,
            'created_at': self.created_at.isoformat(),
            'is_favorite': self.is_favorite,
            'favorite_tags': self.favorite_tags or []
        }
        if include_text:
            result['original_text'] = self.original_text
        return result
    
    def should_expire(self):
        """检查是否应该过期（1 年保存期限）"""
        expiration_date = self.created_at + timedelta(days=365)
        return datetime.utcnow() > expiration_date


class WeeklyReport(db.Model):
    """周报模型"""
    __tablename__ = 'weekly_reports'
    
    id = db.Column(db.String(50), primary_key=True)
    user_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False, index=True)
    week_start = db.Column(db.Date, nullable=False, index=True)
    week_end = db.Column(db.Date, nullable=False)
    report_data = db.Column(db.JSON, nullable=False)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_archived = db.Column(db.Boolean, default=False, index=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'week_start': self.week_start.isoformat(),
            'week_end': self.week_end.isoformat(),
            'report_data': self.report_data,
            'generated_at': self.generated_at.isoformat(),
            'is_archived': self.is_archived
        }


class WeeklyFavorite(db.Model):
    """周报收藏内容模型"""
    __tablename__ = 'weekly_favorites'
    
    id = db.Column(db.String(50), primary_key=True)
    user_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False, index=True)
    collection_id = db.Column(db.String(50), db.ForeignKey('collections.id'), nullable=False, index=True)
    weekly_report_id = db.Column(db.String(50), db.ForeignKey('weekly_reports.id'), nullable=True, index=True)
    keywords = db.Column(db.JSON, default=list)  # 关联的关键词
    favorite_note = db.Column(db.Text, nullable=True)  # 收藏备注
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    expires_at = db.Column(db.DateTime, nullable=False, index=True)  # 1 年后过期
    
    collection = db.relationship('Collection', backref='favorites')
    weekly_report = db.relationship('WeeklyReport', backref='favorites')
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.expires_at = datetime.utcnow() + timedelta(days=365)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'collection_id': self.collection_id,
            'weekly_report_id': self.weekly_report_id,
            'keywords': self.keywords or [],
            'favorite_note': self.favorite_note,
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat()
        }
    
    def is_expired(self):
        """检查是否已过期"""
        return datetime.utcnow() > self.expires_at


class KeywordIndex(db.Model):
    """关键词索引模型，用于快速搜索"""
    __tablename__ = 'keyword_indices'
    
    id = db.Column(db.String(50), primary_key=True)
    keyword = db.Column(db.String(100), nullable=False, index=True)
    user_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False, index=True)
    collection_ids = db.Column(db.JSON, default=list)  # 关联的收藏 ID 列表
    weekly_report_ids = db.Column(db.JSON, default=list)  # 关联的周报 ID 列表
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'keyword': self.keyword,
            'user_id': self.user_id,
            'collection_ids': self.collection_ids or [],
            'weekly_report_ids': self.weekly_report_ids or [],
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
