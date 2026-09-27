"""
Pydantic schemas for Notification operations, payloads, and responses.
"""
import uuid
from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict, Field

from app.models.notification import (
    NotificationType,
    NotificationPriority,
    NotificationTarget,
)


class NotificationBase(BaseModel):
    title: str = Field(..., max_length=500)
    message: str
    priority: NotificationPriority = NotificationPriority.NORMAL
    type: NotificationType = NotificationType.SYSTEM_ALERT
    related_project_id: Optional[uuid.UUID] = None
    attachment_url: Optional[str] = None
    attachment_name: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None


class NotificationResponse(NotificationBase):
    id: uuid.UUID
    broadcast_id: Optional[uuid.UUID] = None
    sender_id: Optional[uuid.UUID] = None
    sender_role: str
    sender_name: Optional[str] = None
    recipient_id: Optional[uuid.UUID] = None
    recipient_role: Optional[str] = None
    is_read: bool
    read_at: Optional[datetime] = None
    is_archived: bool
    archived_at: Optional[datetime] = None
    is_delivered: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationUnreadCountResponse(BaseModel):
    unread_count: int


class AdminBroadcastCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=500)
    message: str = Field(..., min_length=3)
    target_audience: NotificationTarget = NotificationTarget.ALL
    target_user_ids: Optional[List[uuid.UUID]] = None
    priority: NotificationPriority = NotificationPriority.NORMAL
    attachment_url: Optional[str] = None
    attachment_name: Optional[str] = None
    scheduled_for: Optional[datetime] = None


class BroadcastRecipientReceipt(BaseModel):
    recipient_id: uuid.UUID
    recipient_name: str
    recipient_email: str
    recipient_role: str
    is_read: bool
    read_at: Optional[datetime] = None


class BroadcastSummaryResponse(BaseModel):
    broadcast_id: uuid.UUID
    title: str
    message: str
    priority: str
    created_at: datetime
    sender_name: Optional[str] = None
    target_audience: str
    attachment_url: Optional[str] = None
    attachment_name: Optional[str] = None
    total_delivered: int
    total_read: int
    read_percentage: float
    recipients: List[BroadcastRecipientReceipt] = []


class NotificationAuditLogResponse(BaseModel):
    id: uuid.UUID
    notification_id: Optional[uuid.UUID] = None
    broadcast_id: Optional[uuid.UUID] = None
    action: str
    actor_id: Optional[uuid.UUID] = None
    actor_role: Optional[str] = None
    actor_name: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecipientOption(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    role: str
    department: Optional[str] = None
