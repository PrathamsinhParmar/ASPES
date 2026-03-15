"""
Authentication service - create users, validate credentials, generate JWT tokens.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User
from app.schemas.user import TokenResponse, UserCreate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # -------------------------------------------------------------------------
    # User creation
    # -------------------------------------------------------------------------
    async def create_user(self, user_data: UserCreate) -> User:
        # Check duplicates
        email_exists = await self.db.execute(select(User).where(User.email == user_data.email))
        if email_exists.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered")

        username_exists = await self.db.execute(select(User).where(User.username == user_data.username))
        if username_exists.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username already taken")

        hashed_pw = pwd_context.hash(user_data.password)
        user = User(
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name,
            hashed_password=hashed_pw,
            role=user_data.role,
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    # -------------------------------------------------------------------------
    # Authentication
    # -------------------------------------------------------------------------
    async def authenticate_user(self, username_or_email: str, password: str) -> TokenResponse:
        """Authenticate user and return JWT tokens."""
        # Try finding by email first, then username
        result = await self.db.execute(
            select(User).where(
                (User.email == username_or_email) | (User.username == username_or_email)
            )
        )
        user = result.scalar_one_or_none()

        if not user or not pwd_context.verify(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Account is deactivated")

        # Update last login
        user.last_login_at = datetime.now(timezone.utc)

        access_token = self._create_token(
            {"sub": str(user.id), "type": "access", "role": user.role.value},
            timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        refresh_token = self._create_token(
            {"sub": str(user.id), "type": "refresh"},
            timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def refresh_access_token(self, refresh_token: str) -> TokenResponse:
        """Issue a new access token from a valid refresh token."""
        payload = self._decode_token(refresh_token, expected_type="refresh")
        user_id = payload.get("sub")
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        access_token = self._create_token(
            {"sub": str(user.id), "type": "access", "role": user.role.value},
            timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        new_refresh = self._create_token(
            {"sub": str(user.id), "type": "refresh"},
            timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    # -------------------------------------------------------------------------
    # JWT helpers
    # -------------------------------------------------------------------------
    @staticmethod
    def _create_token(data: dict, expires_delta: timedelta) -> str:
        payload = data.copy()
        payload["exp"] = datetime.now(timezone.utc) + expires_delta
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    @staticmethod
    def _decode_token(token: str, expected_type: Optional[str] = None) -> dict:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            if expected_type and payload.get("type") != expected_type:
                raise HTTPException(status_code=401, detail="Invalid token type")
            return payload
        except JWTError:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
