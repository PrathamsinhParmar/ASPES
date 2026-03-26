"""
API Router - Users (profile, list, admin management)
"""
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.models.user import User, UserRole
from app.schemas.user import PasswordChange, UserCreate, UserResponse, UserUpdate
from app.utils.dependencies import get_current_user
from app.utils.security import get_password_hash, validate_password_strength

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
    if update_data.full_name is not None:
        current_user.full_name = update_data.full_name
    if update_data.email is not None:
        current_user.email = update_data.email
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/me/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change the current user's password."""
    from app.utils.security import verify_password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    is_valid, msg = validate_password_strength(password_data.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=msg)
    current_user.hashed_password = get_password_hash(password_data.new_password)
    await db.commit()


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
    result = await db.execute(select(User).offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/faculty", response_model=List[UserResponse])
async def list_faculty(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all faculty (professor) accounts.
    Accessible by Admin only.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    result = await db.execute(
        select(User)
        .where(User.role == UserRole.PROFESSOR)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.post("/faculty", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_faculty(
    faculty_data: UserCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new Faculty (professor) account.
    Only Admin can perform this action.
    The role is forcibly set to PROFESSOR regardless of what payload says.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required to create faculty accounts")

    # Validate password strength
    is_valid, err_msg = validate_password_strength(faculty_data.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=err_msg)

    # Check for duplicate email / username
    from sqlalchemy import or_
    stmt = select(User).where(
        or_(User.email == faculty_data.email, User.username == faculty_data.username)
    )
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        if existing.email == faculty_data.email:
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=400, detail="Username already taken")

    new_faculty = User(
        email=faculty_data.email,
        username=faculty_data.username,
        full_name=faculty_data.full_name,
        role=UserRole.PROFESSOR,   # Always PROFESSOR, never trusts payload
        hashed_password=get_password_hash(faculty_data.password),
    )
    db.add(new_faculty)
    await db.commit()
    await db.refresh(new_faculty)
    return new_faculty


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user by ID (admin/professor or self)."""
    if current_user.id != user_id and current_user.role not in [UserRole.ADMIN, UserRole.PROFESSOR]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
