"""
Database models - Group (faculty project groups)
"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Owner (faculty member)
    owner_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id])
    projects = relationship("Project", back_populates="group", lazy="select")

    def __repr__(self):
        return f"<Group '{self.name}'>"
