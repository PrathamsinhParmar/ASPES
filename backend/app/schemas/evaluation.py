"""
Pydantic schemas - Evaluation
"""
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel

from app.models.evaluation import EvaluationStatus


class EvaluationTrigger(BaseModel):
    """Request to trigger an AI evaluation."""
    project_id: uuid.UUID


class EvaluationResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    status: EvaluationStatus
    celery_task_id: Optional[str]

    total_score: Optional[float]
    code_quality_score: Optional[float]
    documentation_score: Optional[float]
    plagiarism_score: Optional[float]
    report_alignment_score: Optional[float]
    ai_code_score: Optional[float]

    ai_code_detected: bool
    plagiarism_detected: bool

    code_analysis_result: Optional[Dict[str, Any]]
    doc_evaluation_result: Optional[Dict[str, Any]]
    plagiarism_result: Optional[Dict[str, Any]]
    alignment_result: Optional[Dict[str, Any]]
    ai_detection_result: Optional[Dict[str, Any]]

    ai_feedback: Optional[str] = None
    professor_feedback: Optional[str] = None
    professor_score_override: Optional[float] = None

    is_finalized: bool = False
    finalized_at: Optional[datetime] = None

    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    # Optional nested details
    project: Optional[Any] = None

    model_config = {"from_attributes": True}


class ProfessorFeedback(BaseModel):
    """Professor adds manual feedback or score override."""
    feedback: Optional[str] = None
    score_override: Optional[float] = None


class EvaluationStatusResponse(BaseModel):
    """Lightweight status poll response."""
    task_id: str
    status: EvaluationStatus
    progress: int = 0  # 0-100
    message: str = ""


class EvaluationFinalize(BaseModel):
    """Faculty finalizes evaluation with optional score override/feedback."""
    faculty_comments: Optional[str] = None
    modified_score: Optional[float] = None
    is_finalized: bool = True


class EvaluationStatistics(BaseModel):
    """Admin statistics for evaluations."""
    average_total_score: float
    average_code_quality: float
    average_documentation: float
    average_plagiarism: float
    average_report_alignment: float
    grade_distribution: Dict[str, int]
    ai_detection_flags: int
    plagiarism_flags: int
    total_evaluations: int
