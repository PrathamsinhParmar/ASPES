"""
API Router - Users (profile, list, admin management)
"""
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.models.user import User, UserRole
from app.schemas.user import PasswordChange, UserResponse, UserUpdate
from app.utils.dependencies import get_current_user

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update currently authenticated user's profile."""
    from app.services.user_service import UserService
    service = UserService(db)
    return await service.update_user(current_user.id, update_data)


@router.post("/me/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change the current user's password."""
    from app.services.user_service import UserService
    service = UserService(db)
    await service.change_password(current_user, password_data)


@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all users (admin/professor only)."""
    if current_user.role not in [UserRole.ADMIN, UserRole.PROFESSOR]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    from app.services.user_service import UserService
    service = UserService(db)
    return await service.list_users(skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user by ID (admin/professor or self)."""
    if current_user.id != user_id and current_user.role not in [UserRole.ADMIN, UserRole.PROFESSOR]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    from app.services.user_service import UserService
    service = UserService(db)
    return await service.get_user_by_id(user_id)
