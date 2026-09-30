"""
API Router - Notifications System
Handles live WebSocket subscription, CRUD notifications, Admin Broadcasts, and Audit Logs.
"""
import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional

logger = logging.getLogger(__name__)

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
    WebSocket,
    WebSocketDisconnect,
    UploadFile,
    File,
    Form,
)
from sqlalchemy import select, func, desc, update, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.connection import get_db, AsyncSessionLocal
from app.models.notification import (
    Notification,
    NotificationAuditLog,
    NotificationType,
    NotificationPriority,
    NotificationTarget,
)
from app.models.user import User, UserRole
from app.schemas.notification import (
    NotificationResponse,
    NotificationUnreadCountResponse,
    AdminBroadcastCreate,
    BroadcastSummaryResponse,
    BroadcastRecipientReceipt,
    NotificationAuditLogResponse,
    RecipientOption,
)
from app.services.notification_service import (
    manager,
    dispatch_admin_broadcast,
    log_notification_audit,
)
from app.services.file_service import FileService
from app.utils.dependencies import get_current_user, require_role
from app.utils.security import verify_token

router = APIRouter()


# ---------------------------------------------------------------------------
# WebSocket Endpoint for Real-Time Notification Stream
# ---------------------------------------------------------------------------

@router.websocket("/ws")
async def notification_websocket(websocket: WebSocket, token: Optional[str] = Query(None)):
    """
    WebSocket endpoint for real-time notification push.
    Clients connect passing `?token=<jwt_token>`.
    """
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Authenticate token and extract user ID from payload dict
    try:
        payload = verify_token(token)
        user_id_str = payload.get("sub")
        if not user_id_str:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        user_id = uuid.UUID(str(user_id_str))
    except Exception as auth_err:
        logger.warning(f"WebSocket auth failed: {auth_err}")
        try:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        except Exception:
            pass
        return

    # Fetch user from database to verify role
    try:
        async with AsyncSessionLocal() as db:
            res = await db.execute(select(User).where(User.id == user_id))
            user = res.scalar_one_or_none()
            if not user or not user.is_active:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
            user_role = user.role.value
            user_name = user.full_name or user.username
    except Exception as db_err:
        logger.error(f"WebSocket DB user lookup error: {db_err}")
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except Exception:
            pass
        return

    await manager.connect(str(user_id), user_role, websocket)

    # Send welcome acknowledgment with unread count
    try:
        async with AsyncSessionLocal() as db:
            unread_stmt = select(func.count(Notification.id)).where(
                Notification.recipient_id == user_id,
                Notification.is_read == False,
                Notification.is_archived == False,
            )
            unread_count = (await db.execute(unread_stmt)).scalar() or 0

        await websocket.send_json({
            "event": "connected",
            "message": f"Connected to ASPES real-time notification service as {user_name}",
            "unread_count": unread_count,
        })

        # Keep connection alive & handle incoming pings
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(str(user_id), websocket)
    except Exception as ws_err:
        logger.info(f"WebSocket connection closed: {ws_err}")
        manager.disconnect(str(user_id), websocket)


# ---------------------------------------------------------------------------
# User Notification Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=List[NotificationResponse])
async def get_my_notifications(
    type: Optional[str] = Query(None, description="Filter by notification type"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    is_read: Optional[bool] = Query(None, description="Filter by read status"),
    is_archived: bool = Query(False, description="Filter archived notifications"),
    search: Optional[str] = Query(None, description="Search in title or message"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch notifications for the authenticated user with rich filtering and search.
    """
    stmt = (
        select(Notification)
        .where(Notification.recipient_id == current_user.id)
        .where(Notification.is_archived == is_archived)
    )

    if type:
        try:
            enum_type = NotificationType(type)
            stmt = stmt.where(Notification.type == enum_type)
        except ValueError:
            pass

    if priority:
        try:
            enum_priority = NotificationPriority(priority)
            stmt = stmt.where(Notification.priority == enum_priority)
        except ValueError:
            pass

    if is_read is not None:
        stmt = stmt.where(Notification.is_read == is_read)

    if search and search.strip():
        search_filter = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Notification.title.ilike(search_filter),
                Notification.message.ilike(search_filter),
                Notification.sender_name.ilike(search_filter),
            )
        )

    stmt = stmt.order_by(desc(Notification.created_at)).offset(skip).limit(limit)
    res = await db.execute(stmt)
    notifications = res.scalars().all()

    return notifications


@router.get("/unread-count", response_model=NotificationUnreadCountResponse)
async def get_unread_notification_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Quick count of unread, non-archived notifications for header badges.
    """
    stmt = select(func.count(Notification.id)).where(
        Notification.recipient_id == current_user.id,
        Notification.is_read == False,
        Notification.is_archived == False,
    )
    count = (await db.execute(stmt)).scalar() or 0
    return {"unread_count": count}


@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_as_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark a single notification as read and record read receipt.
    """
    stmt = select(Notification).where(
        Notification.id == notification_id,
        Notification.recipient_id == current_user.id,
    )
    res = await db.execute(stmt)
    notif = res.scalar_one_or_none()

    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    if not notif.is_read:
        notif.is_read = True
        notif.read_at = datetime.now(timezone.utc)
        await log_notification_audit(
            db=db,
            action="NOTIFICATION_READ",
            actor_id=current_user.id,
            actor_role=current_user.role.value,
            actor_name=current_user.full_name,
            notification_id=notif.id,
            broadcast_id=notif.broadcast_id,
        )
        await db.commit()
        await db.refresh(notif)

    return notif


@router.put("/mark-all-read")
async def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark all unread notifications as read for current user.
    """
    now = datetime.now(timezone.utc)
    stmt = (
        update(Notification)
        .where(
            Notification.recipient_id == current_user.id,
            Notification.is_read == False,
        )
        .values(is_read=True, read_at=now)
    )
    res = await db.execute(stmt)
    updated_count = res.rowcount

    await log_notification_audit(
        db=db,
        action="ALL_NOTIFICATIONS_MARKED_READ",
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        actor_name=current_user.full_name,
        details={"updated_count": updated_count},
    )
    await db.commit()

    return {"message": f"Marked {updated_count} notifications as read", "updated_count": updated_count}


@router.put("/{notification_id}/archive", response_model=NotificationResponse)
async def archive_notification(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Archive a notification.
    """
    stmt = select(Notification).where(
        Notification.id == notification_id,
        Notification.recipient_id == current_user.id,
    )
    res = await db.execute(stmt)
    notif = res.scalar_one_or_none()

    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_archived = True
    notif.archived_at = datetime.now(timezone.utc)
    
    await log_notification_audit(
        db=db,
        action="NOTIFICATION_ARCHIVED",
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        actor_name=current_user.full_name,
        notification_id=notif.id,
    )
    await db.commit()
    await db.refresh(notif)
    return notif


@router.put("/{notification_id}/unarchive", response_model=NotificationResponse)
async def unarchive_notification(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Restore an archived notification back to inbox.
    """
    stmt = select(Notification).where(
        Notification.id == notification_id,
        Notification.recipient_id == current_user.id,
    )
    res = await db.execute(stmt)
    notif = res.scalar_one_or_none()

    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_archived = False
    notif.archived_at = None
    await db.commit()
    await db.refresh(notif)
    return notif


@router.delete("/{notification_id}", status_code=status.HTTP_200_OK)
async def delete_notification(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a notification for current user.
    """
    stmt = select(Notification).where(
        Notification.id == notification_id,
        Notification.recipient_id == current_user.id,
    )
    res = await db.execute(stmt)
    notif = res.scalar_one_or_none()

    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    await db.delete(notif)
    await log_notification_audit(
        db=db,
        action="NOTIFICATION_DELETED",
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        actor_name=current_user.full_name,
        notification_id=notification_id,
    )
    await db.commit()
    return {"message": "Notification deleted successfully"}


# ---------------------------------------------------------------------------
# Requirement 3: Admin Broadcast & Oversight Endpoints
# ---------------------------------------------------------------------------

@router.get("/recipients-list", response_model=List[RecipientOption])
async def get_recipients_list(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns active students and professors for admin audience targeting.
    """
    stmt = select(User).where(User.is_active == True).order_by(User.full_name)
    res = await db.execute(stmt)
    users = res.scalars().all()
    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role.value,
            "department": u.department,
        }
        for u in users
    ]


@router.post("/broadcast", status_code=status.HTTP_201_CREATED)
async def create_admin_broadcast(
    title: str = Form(...),
    message: str = Form(...),
    target_audience: str = Form("all"),  # all, students, faculty, individual
    priority: str = Form("normal"),      # urgent, normal, informational
    target_user_ids: Optional[str] = Form(None), # comma-separated UUIDs
    attachment_file: Optional[UploadFile] = File(None),
    scheduled_for: Optional[str] = Form(None),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """
    Admin endpoint to compose and broadcast notifications with attachments,
    priority levels, and real-time delivery confirmation.
    """
    try:
        norm_audience = NotificationTarget(target_audience.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid target audience '{target_audience}'")

    try:
        norm_priority = NotificationPriority(priority.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid priority '{priority}'")

    user_ids_list: Optional[List[uuid.UUID]] = None
    if target_user_ids and norm_audience == NotificationTarget.INDIVIDUAL:
        try:
            user_ids_list = [uuid.UUID(uid.strip()) for uid in target_user_ids.split(",") if uid.strip()]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid target user IDs provided")

    attachment_url = None
    attachment_name = None

    if attachment_file and attachment_file.filename:
        fs = FileService()
        try:
            code_or_doc_path = await fs.save_file(attachment_file, subfolder="broadcast_attachments")
            attachment_url = code_or_doc_path
            attachment_name = attachment_file.filename
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload attachment: {e}")

    sched_dt = None
    if scheduled_for:
        try:
            sched_dt = datetime.fromisoformat(scheduled_for.replace("Z", "+00:00"))
        except Exception:
            sched_dt = None

    broadcast_id = await dispatch_admin_broadcast(
        db=db,
        admin=current_user,
        title=title,
        message=message,
        target_audience=norm_audience,
        target_user_ids=user_ids_list,
        priority=norm_priority,
        attachment_url=attachment_url,
        attachment_name=attachment_name,
        scheduled_for=sched_dt,
    )

    await db.commit()

    return {
        "message": "Broadcast sent successfully",
        "broadcast_id": str(broadcast_id),
        "target_audience": norm_audience.value,
        "priority": norm_priority.value,
        "attachment_name": attachment_name,
    }


@router.get("/admin/broadcasts", response_model=List[BroadcastSummaryResponse])
async def get_admin_broadcasts(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """
    Lists past admin broadcasts with delivery confirmation and detailed read receipts.
    """
    # Group by broadcast_id
    stmt = (
        select(Notification)
        .options(selectinload(Notification.recipient))
        .where(
            Notification.type == NotificationType.ADMIN_BROADCAST,
            Notification.broadcast_id.isnot(None),
        )
        .order_by(desc(Notification.created_at))
    )
    res = await db.execute(stmt)
    all_broadcast_notifs = res.scalars().all()

    # Group into dictionary by broadcast_id
    grouped: dict = {}
    for n in all_broadcast_notifs:
        b_id = n.broadcast_id
        if not b_id:
            continue
        if b_id not in grouped:
            meta = n.metadata_json or {}
            grouped[b_id] = {
                "broadcast_id": b_id,
                "title": n.title,
                "message": n.message,
                "priority": n.priority.value,
                "created_at": n.created_at,
                "sender_name": n.sender_name,
                "target_audience": meta.get("target_audience", "all"),
                "attachment_url": n.attachment_url,
                "attachment_name": n.attachment_name,
                "total_delivered": 0,
                "total_read": 0,
                "recipients": [],
            }

        grouped[b_id]["total_delivered"] += 1
        if n.is_read:
            grouped[b_id]["total_read"] += 1

        recip = n.recipient
        grouped[b_id]["recipients"].append({
            "recipient_id": n.recipient_id,
            "recipient_name": recip.full_name if recip else "Unknown",
            "recipient_email": recip.email if recip else "N/A",
            "recipient_role": recip.role.value if recip else "user",
            "is_read": n.is_read,
            "read_at": n.read_at,
        })

    results = []
    for data in grouped.values():
        total = data["total_delivered"]
        read_count = data["total_read"]
        percentage = round((read_count / total * 100), 1) if total > 0 else 0.0
        data["read_percentage"] = percentage
        results.append(data)

    return results


@router.get("/admin/audit-logs", response_model=List[NotificationAuditLogResponse])
async def get_notification_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action keyword"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns audit log of all notification activities for administrative oversight.
    """
    stmt = select(NotificationAuditLog).order_by(desc(NotificationAuditLog.created_at))

    if action:
        stmt = stmt.where(NotificationAuditLog.action.ilike(f"%{action}%"))

    stmt = stmt.offset(skip).limit(limit)
    res = await db.execute(stmt)
    logs = res.scalars().all()
    return logs
