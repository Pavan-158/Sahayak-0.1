"""
Database setup and session management for Sahayak.
Uses SQLAlchemy with SQLite.
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite+aiosqlite:///./sahayak.db"

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()


async def init_db():
    """Initialize database tables."""
    from database.models import Scheme, UserProfile, UserProgress, DocumentRecord
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Database initialized successfully")


async def get_db() -> AsyncSession:
    """Get database session."""
    async with async_session() as session:
        return session
