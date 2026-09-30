"""
Database models - Evaluation
"""
import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, func, JSON, Uuid
# from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


class EvaluationStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Evaluation(Base):
    __tablename__ = "evaluations"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, unique=True)
    evaluator_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"), nullable=True)

    status: Mapped[EvaluationStatus] = mapped_column(Enum(EvaluationStatus), default=EvaluationStatus.PENDING)
    celery_task_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # --- Scores (0-100) ---
    total_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    code_quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    documentation_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    plagiarism_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    report_alignment_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    ai_code_score: Mapped[float | None] = mapped_column(Float, nullable=True)  # Lower = more AI-generated

    # --- Flags ---
    ai_code_detected: Mapped[bool] = mapped_column(default=False)
    plagiarism_detected: Mapped[bool] = mapped_column(default=False)

    # --- Detailed Results (JSON) ---
    code_analysis_result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    doc_evaluation_result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    plagiarism_result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    alignment_result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    ai_detection_result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # --- Feedback ---
    ai_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    structured_feedback: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    professor_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    professor_score_override: Mapped[float | None] = mapped_column(Float, nullable=True)
    status_label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    evaluation_file_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    evaluation_file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # --- Timestamps ---
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    project = relationship("Project", back_populates="evaluation")
    evaluator = relationship("User", back_populates="evaluations", foreign_keys=[evaluator_id])
    
    # Finalization tracking
    is_finalized: Mapped[bool] = mapped_column(default=False)
    finalized_by: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"), nullable=True)
    finalized_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    finalizer = relationship("User", foreign_keys=[finalized_by])

    def __repr__(self):
        return f"<Evaluation [{self.status.value}] score={self.total_score}>"
