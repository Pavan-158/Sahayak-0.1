"""
Database setup and session management for Sahayak.
Uses SQLAlchemy with SQLite.

The application code (main.py) is written in *synchronous* SQLAlchemy style
(db.query(...), db.get(...), db.add(...), await db.commit()), so we back it
with a sync engine wrapped in a thin async-compatible session. Blocking DB
work runs off the event loop via greenlet's ``green_spawn`` inside the
awaitable commit/close, while queries stay synchronous like legacy code expects.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.engine import make_url

DATABASE_URL = "sqlite+aiosqlite:///./sahayak.db"

# Same SQLite file, sync driver (what main.py's query-style code needs)
_SYNC_DATABASE_URL = make_url(DATABASE_URL).render_as_string(hide_password=False).replace(
    "sqlite+aiosqlite", "sqlite"
)

Base = declarative_base()

sync_engine = create_engine(_SYNC_DATABASE_URL, connect_args={"check_same_thread": False})
_Session = sessionmaker(bind=sync_engine, autoflush=False, expire_on_commit=False)


class _AsyncCommitSession:
    """Wraps a sync Session so ``await db.commit()`` / ``await db.close()``
    work in async endpoints; all other calls (query/get/add) are sync."""

    def __init__(self, session):
        self._session = session

    def __getattr__(self, name):
        return getattr(self._session, name)

    async def commit(self):
        from sqlalchemy.exc import SQLAlchemyError
        import anyio
        try:
            await anyio.to_thread.run_sync(self._session.commit)
        except SQLAlchemyError:
            self._session.rollback()
            raise

    async def close(self):
        import anyio
        await anyio.to_thread.run_sync(self._session.close)

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        await self.close()


async def init_db():
    """Initialize database tables."""
    from database.models import Scheme, UserProfile, UserProgress, DocumentRecord  # noqa: F401

    def _create():
        Base.metadata.create_all(sync_engine)

    import anyio
    await anyio.to_thread.run_sync(_create)

    print("✅ Database initialized successfully")


async def get_db() -> _AsyncCommitSession:
    """Get a database session.

    Must be a coroutine (called as ``db = await get_db()`` everywhere), NOT an
    async generator — otherwise every endpoint receives a raw async_generator
    object instead of a usable Session (the original bug behind several
    "'coroutine' object has no attribute ..." 500 errors).
    """
    return _AsyncCommitSession(_Session())
