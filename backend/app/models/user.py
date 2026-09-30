"""
Database models - User
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String, func, Uuid
# from sqlalchemy.dialects.postgresql import UUID  # Removed PG specific UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


class UserRole(str, enum.Enum):
    STUDENT = "student"
    PROFESSOR = "professor"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    profile_photo: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    projects = relationship("Project", foreign_keys="[Project.owner_id]", back_populates="owner", lazy="select")
    assigned_projects = relationship("Project", foreign_keys="[Project.faculty_id]", back_populates="faculty", lazy="select")
    evaluations = relationship(
        "Evaluation", 
        back_populates="evaluator", 
        lazy="select",
        primaryjoin="User.id == Evaluation.evaluator_id",
        overlaps="finalizer"
    )

    def __repr__(self):
        return f"<User {self.username} ({self.role.value})>"
