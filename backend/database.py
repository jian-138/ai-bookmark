"""
FastAPI 数据库配置
使用 SQLAlchemy 异步支持
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from typing import AsyncGenerator
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 数据库 URL（使用 SQLite 异步版本）
# 注意：必须使用 aiosqlite 驱动
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./ai_bookmark.db")

# 验证数据库 URL 是否正确配置为异步驱动
if not DATABASE_URL.startswith("sqlite+aiosqlite"):
    print(f"⚠️ 警告：数据库 URL 未使用异步驱动。当前：{DATABASE_URL}")
    print("请确保 DATABASE_URL 环境变量设置为：sqlite+aiosqlite:///./ai_bookmark.db")


class Base(DeclarativeBase):
    """基础模型类"""
    pass


# 创建异步引擎
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # 开发环境可设为 True 查看 SQL 日志
    future=True,
)

# 异步会话工厂
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """获取数据库会话的依赖注入函数"""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """初始化数据库（创建所有表）"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """关闭数据库连接"""
    await engine.dispose()
