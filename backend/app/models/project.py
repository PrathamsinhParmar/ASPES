"""
Database models - Project
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func, Uuid
# from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


class ProjectStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_EVALUATION = "under_evaluation"
    EVALUATED = "evaluated"
    RETURNED = "returned"
    PUBLISHED = "published"


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ProjectStatus] = mapped_column(Enum(ProjectStatus), default=ProjectStatus.DRAFT)

    # File paths (relative to uploads/)
    code_file_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    report_file_path: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Foreign keys
    owner_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    group_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("groups.id"), nullable=True)
    faculty_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"), nullable=True)
    course_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    batch_year: Mapped[str | None] = mapped_column(String(10), nullable=True)
    team_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    team_members: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string
    live_link: Mapped[str | None] = mapped_column(String(512), nullable=True)
    github_repo_link: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id], back_populates="projects")
    faculty = relationship("User", foreign_keys=[faculty_id], back_populates="assigned_projects")
    group = relationship("Group", back_populates="projects")
    evaluation = relationship("Evaluation", back_populates="project", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Project '{self.title}' [{self.status.value}]>"
