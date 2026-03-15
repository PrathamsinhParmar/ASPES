"""
Export all Pydantic schemas.
"""
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserSummary,
    PasswordChange,
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
)

from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
)

from app.schemas.evaluation import (
    EvaluationTrigger,
    EvaluationResponse,
    ProfessorFeedback,
    EvaluationStatusResponse,
)

__all__ = [
    # User Schemas
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserSummary",
    "PasswordChange",
    "LoginRequest",
    "TokenResponse",
    "RefreshTokenRequest",

    # Project Schemas
    "ProjectCreate",
    "ProjectUpdate",
    "ProjectResponse",
    "ProjectListResponse",

    # Evaluation Schemas
    "EvaluationTrigger",
    "EvaluationResponse",
    "ProfessorFeedback",
    "EvaluationStatusResponse",
]
