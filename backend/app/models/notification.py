"""
Database models - Notification and NotificationAuditLog
Supports real-time alerts, role-based broadcasting, read receipts, and administrative auditing.
"""
import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text, func, JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


class NotificationType(str, enum.Enum):
    PROJECT_SUBMISSION = "project_submission"
    FACULTY_EVALUATION = "faculty_evaluation"
    ADMIN_BROADCAST = "admin_broadcast"
    SYSTEM_ALERT = "system_alert"


class NotificationPriority(str, enum.Enum):
    URGENT = "urgent"
    NORMAL = "normal"
    INFORMATIONAL = "informational"


class NotificationTarget(str, enum.Enum):
    ALL = "all"
    STUDENTS = "students"
    FACULTY = "faculty"
    INDIVIDUAL = "individual"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    
    # Broadcast group identifier to correlate copies sent to multiple recipients
    broadcast_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True, index=True)

    # Sender information
    sender_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    sender_role: Mapped[str] = mapped_column(String(50), default="system", nullable=False)
    sender_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Recipient information
    recipient_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    recipient_role: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)

    # Notification category and priority
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType), default=NotificationType.SYSTEM_ALERT, nullable=False, index=True
    )
    priority: Mapped[NotificationPriority] = mapped_column(
        Enum(NotificationPriority), default=NotificationPriority.NORMAL, nullable=False
    )

    # Content
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Optional links & attachments
    related_project_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True
    )
    attachment_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    attachment_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Extended structured details (student details, scores, metrics, feedback, submission files)
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Status tracking & read receipts
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Scheduling
    scheduled_for: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_delivered: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], lazy="selectin")
    recipient = relationship("User", foreign_keys=[recipient_id], lazy="selectin")
    project = relationship("Project", foreign_keys=[related_project_id], lazy="selectin")

    def __repr__(self):
        return f"<Notification '{self.title}' [{self.type.value}] -> {self.recipient_id}>"


class NotificationAuditLog(Base):
    __tablename__ = "notification_audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    notification_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True, index=True)
    broadcast_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True, index=True)
    
    # Action e.g. CREATED, BROADCAST_SENT, DELIVERED_REALTIME, READ, ARCHIVED, DELETED
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    
    actor_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    actor_role: Mapped[str | None] = mapped_column(String(50), nullable=True)
    actor_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Details payload (e.g. recipient_count, client_ip, timestamp, extra data)
    details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    actor = relationship("User", foreign_keys=[actor_id], lazy="selectin")

    def __repr__(self):
        return f"<NotificationAuditLog {self.action} by {self.actor_name or self.actor_id}>"
