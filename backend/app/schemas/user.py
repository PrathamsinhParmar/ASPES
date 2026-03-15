"""
Pydantic schemas - User (request/response validation)
"""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import UserRole


# --- Request Schemas ---

class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    full_name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.STUDENT


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


# --- Response Schemas ---

class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    username: str
    full_name: str
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserSummary(BaseModel):
    """Lightweight user info (for embedding in other responses)."""
    id: uuid.UUID
    username: str
    full_name: str
    role: UserRole

    model_config = {"from_attributes": True}


# --- Auth Schemas ---

class LoginRequest(BaseModel):
    username: str   # Can be email or username
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int            # seconds


class RefreshTokenRequest(BaseModel):
    refresh_token: str
