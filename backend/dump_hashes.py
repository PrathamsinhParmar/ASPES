import asyncio
from sqlalchemy import select
from app.database.connection import AsyncSessionLocal
from app.models.user import User
import logging

logging.disable(logging.CRITICAL)

async def dump_hashes():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        for u in users:
            print(f"U: {u.username} | Len: {len(u.hashed_password)} | Hash: {u.hashed_password}")

if __name__ == "__main__":
    asyncio.run(dump_hashes())
