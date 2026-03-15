"""
Database connection setup using SQLAlchemy 2.0 async engine.
Supports both SQLite (development) and PostgreSQL (production).
"""
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# ── URL normalisation ──────────────────────────────────────────────────────
DATABASE_URL = settings.DATABASE_URL

# postgresql:// → postgresql+asyncpg://
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# ── Engine kwargs differ between SQLite and PostgreSQL ────────────────────
IS_SQLITE = DATABASE_URL.startswith("sqlite")

if IS_SQLITE:
    # SQLite / aiosqlite does NOT support connection pools or threadsafety args
    engine_kwargs = {
        "echo": settings.DEBUG,
        "future": True,
        "connect_args": {"check_same_thread": False},
    }
else:
    engine_kwargs = {
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "echo": settings.DEBUG,
        "future": True,
    }

engine = create_async_engine(DATABASE_URL, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency: yields a database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            # Removed automatic commit here to avoid deadlocks; 
            # Endpoints should call await db.commit() explicitly.
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
