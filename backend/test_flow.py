import asyncio, sys, os, traceback
sys.path.insert(0, '.')

from app.database.connection import AsyncSessionLocal
from app.api.projects import get_project_details
from app.models.user import UserRole
import uuid

# Create a dummy user
class DummyUser:
    id = uuid.uuid4()
    role = UserRole.ADMIN

async def run():
    async with AsyncSessionLocal() as db:
        # Get latest project ID
        from sqlalchemy import select
        from app.models.project import Project
        res = await db.execute(select(Project).order_by(Project.created_at.desc()).limit(1))
        proj = res.scalars().first()
        
        if not proj:
            print("No project found.")
            return

        print(f"Testing detail for project: {proj.id}")
        user = DummyUser()
        try:
            res = await get_project_details(proj.id, db, user)
            print("Success!", type(res))
            print(res)
        except Exception as e:
            print("ERROR:")
            traceback.print_exc()

asyncio.run(run())
