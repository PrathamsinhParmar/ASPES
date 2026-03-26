"""
Dedicated Faculty List Router - standalone, unambiguous endpoint.
Accessible by ALL authenticated users (students need it for project submission).
"""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserResponse
from app.utils.dependencies import get_current_user

router = APIRouter()


@router.get("", response_model=List[UserResponse], tags=["Faculty"])
@router.get("/", response_model=List[UserResponse], tags=["Faculty"])
async def get_faculty_list(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve all faculty (PROFESSOR role) accounts.
    Accessible by ALL authenticated users — students use this to pick a supervisor
    during project submission.
    """
    result = await db.execute(
        select(User)
        .where(User.role == UserRole.PROFESSOR)
        .where(User.is_active == True)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()
