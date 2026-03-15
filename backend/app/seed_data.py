import asyncio
import logging
from sqlalchemy import select
from app.database.connection import AsyncSessionLocal
from app.models.user import User, UserRole
from app.utils.security import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")

async def seed_data():
    """Seed initial admin and faculty users."""
    async with AsyncSessionLocal() as db:
        try:
            # 1. Create Admin
            admin_email = "admin@aspes.edu"
            stmt = select(User).where(User.email == admin_email)
            result = await db.execute(stmt)
            if not result.scalar_one_or_none():
                admin = User(
                    email=admin_email,
                    username="admin",
                    full_name="System Administrator",
                    hashed_password=get_password_hash("admin123"),
                    role=UserRole.ADMIN,
                    is_active=True,
                    is_verified=True
                )
                db.add(admin)
                logger.info("✅ Admin user created (admin@aspes.edu / admin123)")

            # 2. Create Sample Faculty
            faculty_email = "prof.smith@aspes.edu"
            stmt = select(User).where(User.email == faculty_email)
            result = await db.execute(stmt)
            if not result.scalar_one_or_none():
                faculty = User(
                    email=faculty_email,
                    username="smith",
                    full_name="Prof. John Smith",
                    hashed_password=get_password_hash("faculty123"),
                    role=UserRole.PROFESSOR,
                    is_active=True,
                    is_verified=True
                )
                db.add(faculty)
                logger.info("✅ Faculty user created (prof.smith@aspes.edu / faculty123)")

            await db.commit()
        except Exception as e:
            logger.error(f"❌ Seeding failed: {e}")
            await db.rollback()
        finally:
            await db.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
