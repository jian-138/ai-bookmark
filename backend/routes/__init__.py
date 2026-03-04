"""
Backend Routes - FastAPI 版本
"""

from backend.routes.weekly_favorites import router as weekly_favorites_router

__all__ = [
    'weekly_favorites_router',
]
