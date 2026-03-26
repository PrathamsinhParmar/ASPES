"""
Pydantic schemas - Project
"""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.project import ProjectStatus


class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)
    course_name: Optional[str] = Field(None, max_length=255)
    batch_year: Optional[str] = Field(None, max_length=10)


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=500)
    description: Optional[str] = None
    course_name: Optional[str] = None
    batch_year: Optional[str] = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str]
    status: ProjectStatus
    code_file_path: Optional[str]
    report_file_path: Optional[str]
    owner_id: uuid.UUID
    group_id: Optional[uuid.UUID] = None
    faculty_id: Optional[uuid.UUID] = None
    course_name: Optional[str]
    batch_year: Optional[str]
    team_name: Optional[str] = None
    team_members: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime]

    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    """Lightweight project listing."""
    id: uuid.UUID
    title: str
    status: ProjectStatus
    course_name: Optional[str]
    batch_year: Optional[str]
    team_name: Optional[str] = None
    team_members: Optional[str] = None
    created_at: datetime
    has_evaluation: bool = False
    total_score: Optional[float] = None

    model_config = {"from_attributes": True}


from app.schemas.evaluation import EvaluationResponse

class ProjectWithEvaluation(ProjectResponse):
    """Project with its associated evaluation data."""
    evaluation: Optional[EvaluationResponse] = None

    model_config = {"from_attributes": True}
