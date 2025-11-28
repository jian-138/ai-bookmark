from datetime import datetime
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
    
    def to_dict(self, include_text=False):
        result = {
            'id': self.id,
            'keywords': self.keywords or [],
            'category': self.category,
            'source_app': self.source_app,
            'source_url': self.source_url,
            'created_at': self.created_at.isoformat()
        }
        if include_text:
            result['original_text'] = self.original_text
        return result
