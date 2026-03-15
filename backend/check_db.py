import asyncio
import logging
logging.disable(logging.CRITICAL) # Disable EVERYTHING from logging

from sqlalchemy import select
from app.database.connection import AsyncSessionLocal
from app.models.user import User

async def check_users():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        print(f"DEBUG: Found {len(users)} users.")
        for u in users:
            print(f"USER: {u.username} | EMAIL: {u.email} | ROLE: {u.role}")

if __name__ == "__main__":
    asyncio.run(check_users())
