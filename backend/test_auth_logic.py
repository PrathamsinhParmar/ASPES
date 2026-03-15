import asyncio
from sqlalchemy import select
from app.database.connection import AsyncSessionLocal
from app.models.user import User
from app.utils.security import verify_password
import logging

logging.disable(logging.CRITICAL)

async def test_logins():
    # Test for seeded users
    tests = [
        ("admin@aspes.edu", "admin123"),
        ("prof.smith@aspes.edu", "faculty123")
    ]
    
    async with AsyncSessionLocal() as db:
        for email, password in tests:
            result = await db.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()
            if not user:
                print(f"FAIL: User {email} not found in DB")
                continue
            
            is_match = verify_password(password, user.hashed_password)
            print(f"TEST: {email} | Password: {password} | Match: {is_match}")
            if not is_match:
                print(f"  Hash in DB: {user.hashed_password}")

if __name__ == "__main__":
    asyncio.run(test_logins())
