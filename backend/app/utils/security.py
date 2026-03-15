"""
Authentication and security utilities for the FastAPI backend.
Contains functions for hashing passwords, creating JWT tokens,
and validating password strength.
"""
import re
from datetime import datetime, timedelta, timezone
from typing import Optional, Any

from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hashes a password using bcrypt."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a JWT access token containing User ID, Username, and Role.
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # Default to 7 days if not provided
        expire = datetime.now(timezone.utc) + timedelta(days=7)
        
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict:
    """
    Decodes and verifies a JWT token.
    Raises HTTPException on failure (expired, invalid signature, etc).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise credentials_exception


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validates password strength.
    Requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    
    Returns (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
        
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
        
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit."
        
    return True, ""
