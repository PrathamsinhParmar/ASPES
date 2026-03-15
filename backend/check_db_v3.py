import asyncio
import logging
logging.disable(logging.CRITICAL)

from sqlalchemy import select
from app.database.connection import AsyncSessionLocal
from app.models.user import User

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User))
        users = res.scalars().all()
        print(f"TOTAL_USERS:{len(users)}")
        for u in users:
            print(f"U:{u.username}|E:{u.email}|R:{u.role.value}")

if __name__ == "__main__":
    asyncio.run(check())
