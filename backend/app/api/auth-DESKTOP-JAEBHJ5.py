"""
API Router - Authentication Ends
"""
import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database.connection import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate, 
    UserResponse, 
    TokenResponse, 
    PasswordChange,
    RefreshTokenRequest
)
from app.utils.dependencies import get_current_user, get_current_active_user
from app.utils.security import (
    create_access_token,
    get_password_hash,
    validate_password_strength,
    verify_password,
    verify_token
)

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Register a new user account.
    Validates password strength and checks for existing users.
    """
    # 1. Check password strength
    is_valid, err_msg = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=err_msg
        )

    # 2. Check if username or email already exists
    stmt = select(User).where(
        or_(
            User.email == user_data.email,
            User.username == user_data.username
        )
    )
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        if existing_user.email == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )

    # 3. Hash password and save
    # Public registration always creates STUDENT accounts.
    # Faculty accounts are created exclusively by Admin via the admin endpoint.
    from app.models.user import UserRole
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        role=UserRole.STUDENT,   # Force STUDENT role on public signup
        hashed_password=get_password_hash(user_data.password)
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return a JWT token.
    Follows OAuth2 password flow.
    """
    # 1. Find user by username or email
    import logging
    logger = logging.getLogger("aspes")
    logger.warning(f"DEBUG: Login attempt for username: '{form_data.username}'")
    
    stmt = select(User).where(
        or_(
            User.username == form_data.username,
            User.email == form_data.username
        )
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if user:
        logger.warning(f"DEBUG: User found in DB: {user.email}")
    else:
        logger.warning(f"DEBUG: No user found in DB matching: '{form_data.username}'")
    
    # 2. Verify password (sanitized error msg)
    auth_err = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not user:
        import logging
        logging.getLogger("aspes").warning(f"Login attempt failed: User not found for {form_data.username}")
        raise auth_err
        
    if not verify_password(form_data.password, user.hashed_password):
        import logging
        logging.getLogger("aspes").warning(f"Login attempt failed: Incorrect password for {form_data.username}")
        raise auth_err
        
    # 3. Create tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "type": "access", "role": user.role.value},
        expires_delta=access_token_expires
    )
    
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = create_access_token(
        data={"sub": str(user.id), "type": "refresh"},
        expires_delta=refresh_token_expires
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": int(access_token_expires.total_seconds())
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    """
    Retrieve current authenticated user data.
    """
    return current_user


@router.put("/change-password")
async def change_password(
    pwd_data: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Change password for the current user.
    """
    # 1. Verify old password
    if not verify_password(pwd_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Incorrect current password"
        )
        
    # 2. Check new password strength
    is_valid, msg = validate_password_strength(pwd_data.new_password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
        
    # 3. Check if new password is the same as old
    if pwd_data.current_password == pwd_data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be the same as the old password"
        )
        
    # 4. Hash and save
    current_user.hashed_password = get_password_hash(pwd_data.new_password)
    await db.commit()
    
    return {"message": "Password changed successfully"}


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new access token using a valid refresh token.
    """
    token_str = refresh_request.refresh_token
    payload = verify_token(token_str)
    
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")
        
    user_id = payload.get("sub")
    
    # create new
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_id, "type": "access"},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "refresh_token": token_str,
        "token_type": "bearer",
        "expires_in": int(access_token_expires.total_seconds())
    }
