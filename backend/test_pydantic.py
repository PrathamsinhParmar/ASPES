import asyncio, sys, os, traceback, logging
logging.disable(logging.CRITICAL)
sys.path.insert(0, '.')

from app.database.connection import AsyncSessionLocal
from app.schemas.project import ProjectWithEvaluation
from app.api.projects import get_project_details
from app.models.user import UserRole
import uuid

class DummyUser:
    id = "uuid"
    role = UserRole.ADMIN

async def run():
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select
        from app.models.project import Project
        from app.schemas.project import ProjectWithEvaluation
        from sqlalchemy.orm import selectinload
        
        # get test project
        res = await db.execute(select(Project).options(selectinload(Project.evaluation)).order_by(Project.created_at.desc()).limit(1))
        proj = res.scalars().first()
        
        print("Testing Pydantic validation...")
        try:
            model = ProjectWithEvaluation.model_validate(proj)
            print("Validate success!")
        except Exception as e:
            print("Validation error:", e)

asyncio.run(run())
