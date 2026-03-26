"""
API Router - Users (profile, list, admin management)
"""
import uuid
import os
import shutil
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.models.user import User, UserRole
from app.schemas.user import AdminUserUpdate, PasswordChange, UserCreate, UserResponse, UserUpdate
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


# NOTE: /faculty must be registered BEFORE the generic /{user_id} wildcard route
# and also before the role-restricted GET / list to ensure correct FastAPI routing.
@router.get("/faculty", response_model=List[UserResponse])
async def list_faculty(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all faculty (professor) accounts.
    Accessible by ALL authenticated users (students need this to pick a supervisor).
    """
    result = await db.execute(
        select(User)
        .where(User.role == UserRole.PROFESSOR)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


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
        department=faculty_data.department,
        role=UserRole.PROFESSOR,   # Always PROFESSOR, never trusts payload
        hashed_password=get_password_hash(faculty_data.password),
    )
    db.add(new_faculty)
    await db.commit()
    await db.refresh(new_faculty)
    return new_faculty


@router.delete("/faculty/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faculty(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a Faculty (professor) account.
    Only Admin can perform this action.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required to delete faculty accounts")

    result = await db.execute(
        select(User).where(User.id == user_id, User.role == UserRole.PROFESSOR)
    )
    faculty = result.scalar_one_or_none()
    
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty member not found or user is not a faculty")

    await db.delete(faculty)
    await db.commit()


@router.put("/faculty/{user_id}", response_model=UserResponse)
async def update_faculty(
    user_id: uuid.UUID,
    faculty_data: AdminUserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a Faculty (professor) account.
    Only Admin can perform this action.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required to edit faculty accounts")

    result = await db.execute(
        select(User).where(User.id == user_id, User.role == UserRole.PROFESSOR)
    )
    faculty = result.scalar_one_or_none()
    
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty member not found or user is not a faculty")

    # Check email and username collisions
    from sqlalchemy import or_
    if faculty_data.email or faculty_data.username:
        clauses = []
        if faculty_data.email and faculty_data.email != faculty.email:
            clauses.append(User.email == faculty_data.email)
        if faculty_data.username and faculty_data.username != faculty.username:
            clauses.append(User.username == faculty_data.username)
            
        if clauses:
            stmt = select(User).where(or_(*clauses))
            existing = (await db.execute(stmt)).scalar_one_or_none()
            if existing:
                if faculty_data.email and existing.email == faculty_data.email:
                    raise HTTPException(status_code=400, detail="Email already registered")
                if faculty_data.username and existing.username == faculty_data.username:
                    raise HTTPException(status_code=400, detail="Username already taken")

    if faculty_data.password:
        is_valid, err_msg = validate_password_strength(faculty_data.password)
        if not is_valid:
            raise HTTPException(status_code=400, detail=err_msg)
        faculty.hashed_password = get_password_hash(faculty_data.password)

    if faculty_data.full_name is not None:
        faculty.full_name = faculty_data.full_name
    if faculty_data.email is not None:
        faculty.email = faculty_data.email
    if faculty_data.username is not None:
        faculty.username = faculty_data.username
    if faculty_data.department is not None:
        faculty.department = faculty_data.department
    if faculty_data.is_active is not None:
        faculty.is_active = faculty_data.is_active

    await db.commit()
    await db.refresh(faculty)
    return faculty


@router.post("/faculty/{user_id}/photo", response_model=UserResponse)
async def upload_faculty_photo(
    user_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a profile photo for a faculty member.
    Only Admin can perform this.
    """
    from app.config import settings
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    result = await db.execute(select(User).where(User.id == user_id, User.role == UserRole.PROFESSOR))
    faculty = result.scalar_one_or_none()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty member not found")

    # Validate file format
    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif"}
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Unsupported file format (only jpg, jpeg, png, gif allowed).")
    
    # Save file
    filename = f"{user_id}{ext}"
    faculty_dir = Path(settings.UPLOAD_DIR) / "faculty"
    faculty_dir.mkdir(parents=True, exist_ok=True)
    file_path = faculty_dir / filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    faculty.profile_photo = f"/uploads/faculty/{filename}"
    await db.commit()
    await db.refresh(faculty)
    return faculty


@router.delete("/faculty/{user_id}/photo", response_model=UserResponse)
async def remove_faculty_photo(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Remove a profile photo for a faculty member.
    """
    from app.config import settings
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    result = await db.execute(select(User).where(User.id == user_id, User.role == UserRole.PROFESSOR))
    faculty = result.scalar_one_or_none()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty member not found")

    if faculty.profile_photo:
        try:
            relative_path = faculty.profile_photo.replace("/uploads/", "", 1)
            file_path = Path(settings.UPLOAD_DIR) / relative_path
            if file_path.exists():
                file_path.unlink()
        except Exception:
            pass # ignore deletion errors

        faculty.profile_photo = None
        await db.commit()
        await db.refresh(faculty)

    return faculty


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
