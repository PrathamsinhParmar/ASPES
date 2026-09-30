"""
Notification Service - Real-Time Push (WebSockets) & Database Lifecycle Management
Handles real-time WebSocket connection state, notification persistence, role broadcasting, and audit logging.
"""
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set, Any

from fastapi import WebSocket
from sqlalchemy import select, func, desc, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.notification import (
    Notification,
    NotificationAuditLog,
    NotificationType,
    NotificationPriority,
    NotificationTarget,
)
from app.models.user import User, UserRole
from app.models.project import Project

logger = logging.getLogger("aspes.notifications")


class ConnectionManager:
    """
    Manages active WebSocket connections mapped per user ID.
    Supports multi-device / multi-tab connections per user.
    """

    def __init__(self):
        # user_id string -> set of active WebSockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # websocket -> role string (for role-based fast filtering)
        self.socket_roles: Dict[WebSocket, str] = {}

    async def connect(self, user_id: str, role: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        self.socket_roles[websocket] = (role or "").lower()
        logger.info(f"🔌 WebSocket connected: User {user_id} ({role}) [Total connections for user: {len(self.active_connections[user_id])}]")

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        if websocket in self.socket_roles:
            del self.socket_roles[websocket]
        logger.info(f"❌ WebSocket disconnected: User {user_id}")

    async def send_personal_message(self, user_id: str, message: dict):
        """Send message to all open WebSockets for a specific user."""
        target_sockets = self.active_connections.get(str(user_id), set()).copy()
        dead_sockets = set()
        for ws in target_sockets:
            try:
                await ws.send_text(json.dumps(message, default=str))
            except Exception as e:
                logger.warning(f"Failed to send to socket for user {user_id}: {e}")
                dead_sockets.add(ws)
        for dead in dead_sockets:
            self.disconnect(user_id, dead)

    async def broadcast_to_role(self, role: str, message: dict):
        """Send message to all active sockets belonging to users with a specific role."""
        norm_role = role.lower()
        # Role synonyms (professor == faculty)
        allowed = {norm_role}
        if norm_role in ("professor", "faculty"):
            allowed.update(["professor", "faculty"])

        for user_id, sockets in list(self.active_connections.items()):
            for ws in list(sockets):
                ws_role = self.socket_roles.get(ws, "")
                if ws_role in allowed:
                    try:
                        await ws.send_text(json.dumps(message, default=str))
                    except Exception:
                        self.disconnect(user_id, ws)

    async def broadcast_to_all(self, message: dict):
        """Broadcast message to every active connection."""
        for user_id, sockets in list(self.active_connections.items()):
            for ws in list(sockets):
                try:
                    await ws.send_text(json.dumps(message, default=str))
                except Exception:
                    self.disconnect(user_id, ws)


# Global singleton connection manager
manager = ConnectionManager()


# ---------------------------------------------------------------------------
# Database Notification Helpers
# ---------------------------------------------------------------------------

async def log_notification_audit(
    db: AsyncSession,
    action: str,
    actor_id: Optional[uuid.UUID] = None,
    actor_role: Optional[str] = None,
    actor_name: Optional[str] = None,
    notification_id: Optional[uuid.UUID] = None,
    broadcast_id: Optional[uuid.UUID] = None,
    details: Optional[dict] = None,
):
    """Record an audit trail event for administrative oversight."""
    try:
        audit = NotificationAuditLog(
            action=action,
            actor_id=actor_id,
            actor_role=actor_role,
            actor_name=actor_name,
            notification_id=notification_id,
            broadcast_id=broadcast_id,
            details=details or {},
        )
        db.add(audit)
        await db.flush()
    except Exception as e:
        logger.error(f"Failed to log notification audit: {e}")


async def create_single_notification(
    db: AsyncSession,
    title: str,
    message: str,
    notification_type: NotificationType,
    sender_id: Optional[uuid.UUID] = None,
    sender_role: str = "system",
    sender_name: Optional[str] = None,
    recipient_id: Optional[uuid.UUID] = None,
    recipient_role: Optional[str] = None,
    priority: NotificationPriority = NotificationPriority.NORMAL,
    related_project_id: Optional[uuid.UUID] = None,
    attachment_url: Optional[str] = None,
    attachment_name: Optional[str] = None,
    metadata_json: Optional[dict] = None,
    broadcast_id: Optional[uuid.UUID] = None,
    actor: Optional[User] = None,
) -> Notification:
    """
    Creates and persists a single notification, writes an audit record,
    and immediately pushes it over WebSocket to the recipient in real-time.
    """
    notif = Notification(
        broadcast_id=broadcast_id,
        sender_id=sender_id,
        sender_role=sender_role,
        sender_name=sender_name,
        recipient_id=recipient_id,
        recipient_role=recipient_role,
        type=notification_type,
        priority=priority,
        title=title,
        message=message,
        related_project_id=related_project_id,
        attachment_url=attachment_url,
        attachment_name=attachment_name,
        metadata_json=metadata_json or {},
        is_read=False,
        is_archived=False,
        is_delivered=True,
    )
    db.add(notif)
    await db.flush()
    await db.refresh(notif)

    # Log audit entry
    await log_notification_audit(
        db=db,
        action=f"CREATED_{notification_type.value.upper()}",
        actor_id=actor.id if actor else sender_id,
        actor_role=actor.role.value if actor else sender_role,
        actor_name=actor.full_name if actor else sender_name,
        notification_id=notif.id,
        broadcast_id=broadcast_id,
        details={
            "recipient_id": str(recipient_id) if recipient_id else None,
            "title": title,
            "priority": priority.value,
        },
    )

    # Real-time WebSocket dispatch
    payload = {
        "event": "new_notification",
        "notification": {
            "id": str(notif.id),
            "type": notif.type.value,
            "priority": notif.priority.value,
            "title": notif.title,
            "message": notif.message,
            "sender_name": notif.sender_name,
            "sender_role": notif.sender_role,
            "recipient_id": str(notif.recipient_id) if notif.recipient_id else None,
            "related_project_id": str(notif.related_project_id) if notif.related_project_id else None,
            "attachment_url": notif.attachment_url,
            "attachment_name": notif.attachment_name,
            "metadata_json": notif.metadata_json,
            "is_read": False,
            "created_at": notif.created_at.isoformat() if notif.created_at else datetime.now(timezone.utc).isoformat(),
        }
    }

    if recipient_id:
        await manager.send_personal_message(str(recipient_id), payload)
    elif recipient_role:
        await manager.broadcast_to_role(recipient_role, payload)
    else:
        await manager.broadcast_to_all(payload)

    return notif


# ---------------------------------------------------------------------------
# Requirement 1: Student Project Submission Notification to Faculty
# ---------------------------------------------------------------------------

async def notify_faculty_on_project_submission(
    db: AsyncSession,
    project: Project,
    student: User,
):
    """
    Triggered when a student submits a project with complete details and faculty selection.
    Delivers a rich notification to the assigned faculty with complete student & project details.
    """
    if not project.faculty_id:
        logger.info(f"Project {project.id} submitted without assigned faculty; skipping faculty submission notification.")
        return

    # Fetch faculty user details
    stmt = select(User).where(User.id == project.faculty_id)
    res = await db.execute(stmt)
    faculty = res.scalar_one_or_none()
    if not faculty:
        logger.warning(f"Assigned faculty {project.faculty_id} not found for project {project.id}")
        return

    submission_time = project.submitted_at or datetime.now(timezone.utc)
    formatted_time = submission_time.strftime("%d %b %Y, %I:%M %p UTC")

    # Team members formatting
    team_info = None
    if project.team_members:
        try:
            team_info = json.loads(project.team_members)
        except Exception:
            team_info = project.team_members

    metadata = {
        "student_id": str(student.id),
        "student_name": student.full_name,
        "student_email": student.email,
        "student_department": student.department or "N/A",
        "submission_id": str(project.id),
        "project_title": project.title,
        "description": project.description or "No description provided.",
        "course_name": project.course_name or "General",
        "team_name": project.team_name,
        "team_members": team_info,
        "code_file_path": project.code_file_path,
        "report_file_path": project.report_file_path,
        "live_link": project.live_link,
        "github_repo_link": project.github_repo_link,
        "submitted_at_str": formatted_time,
        "submitted_at": submission_time.isoformat(),
        # Slot for admin instructions or platform submission guidelines
        "admin_notation": "Project submitted under Standard Academic Guidelines. Automated AI Evaluation pipeline initialized.",
    }

    title = f"New Project Submitted: {project.title}"
    message = (
        f"Student {student.full_name} has submitted '{project.title}' for course '{project.course_name or 'Default'}'. "
        f"Assigned to you for faculty review. Submission ID: #{str(project.id)[:8]}."
    )

    await create_single_notification(
        db=db,
        title=title,
        message=message,
        notification_type=NotificationType.PROJECT_SUBMISSION,
        sender_id=student.id,
        sender_role=UserRole.STUDENT.value,
        sender_name=student.full_name,
        recipient_id=faculty.id,
        recipient_role=UserRole.PROFESSOR.value,
        priority=NotificationPriority.NORMAL,
        related_project_id=project.id,
        attachment_url=project.report_file_path or project.code_file_path,
        attachment_name="Project Report / Code Archive",
        metadata_json=metadata,
        actor=student,
    )
    logger.info(f"✅ Real-time submission notification sent to Faculty {faculty.full_name} ({faculty.id}) for project {project.id}")


# ---------------------------------------------------------------------------
# Requirement 2: Faculty Evaluation / Review Notification to Student
# ---------------------------------------------------------------------------

async def notify_student_on_faculty_evaluation(
    db: AsyncSession,
    project: Project,
    faculty: User,
    status_label: str = "reviewed",
    faculty_feedback: Optional[str] = None,
    faculty_score: Optional[float] = None,
    evaluation_record: Optional[Any] = None,
    evaluation_file_url: Optional[str] = None,
    evaluation_file_name: Optional[str] = None,
):
    """
    Triggered when assigned faculty reviews, evaluates, approves, rejects, or requests revision on a project.
    Delivers a real-time notification + popup alert to the student with evaluation score and feedback.
    """
    if not project.owner_id:
        return

    # Status label normalization
    # options: "reviewed", "feedback provided", "approved", "rejected", "revision requested"
    norm_status = status_label.strip()

    eval_time = datetime.now(timezone.utc)
    formatted_time = eval_time.strftime("%d %b %Y, %I:%M %p UTC")

    # Gather assessment metrics
    total_score = faculty_score
    code_score = None
    doc_score = None
    plag_score = None
    align_score = None

    if evaluation_record:
        if total_score is None:
            total_score = evaluation_record.total_score
        code_score = evaluation_record.code_quality_score
        doc_score = evaluation_record.documentation_score
        plag_score = evaluation_record.plagiarism_score
        align_score = evaluation_record.report_alignment_score
        if not evaluation_file_url:
            evaluation_file_url = getattr(evaluation_record, "evaluation_file_url", None)
        if not evaluation_file_name:
            evaluation_file_name = getattr(evaluation_record, "evaluation_file_name", None)

    if evaluation_file_url:
        clean_url = evaluation_file_url.replace("\\", "/")
        if clean_url.startswith("https:/") and not clean_url.startswith("https://"):
            evaluation_file_url = "https://" + clean_url[7:].lstrip("/")
        elif clean_url.startswith("http:/") and not clean_url.startswith("http://"):
            evaluation_file_url = "http://" + clean_url[6:].lstrip("/")
        else:
            evaluation_file_url = clean_url

    metadata = {
        "project_id": str(project.id),
        "project_title": project.title,
        "faculty_name": faculty.full_name,
        "faculty_email": faculty.email,
        "evaluation_status": norm_status,
        "feedback": faculty_feedback or "No detailed remarks provided.",
        "score": round(float(total_score), 2) if total_score is not None else None,
        "attachment_url": evaluation_file_url,
        "attachment_name": evaluation_file_name,
        "metrics": {
            "total_score": round(float(total_score), 2) if total_score is not None else None,
            "code_quality": round(float(code_score), 2) if code_score is not None else None,
            "documentation": round(float(doc_score), 2) if doc_score is not None else None,
            "plagiarism": round(float(plag_score), 2) if plag_score is not None else None,
            "report_alignment": round(float(align_score), 2) if align_score is not None else None,
        },
        "reviewed_at_str": formatted_time,
        "reviewed_at": eval_time.isoformat(),
        "admin_notation": "Evaluation recorded in institutional records. Review rubric guidelines in project view.",
    }

    # Determine priority based on status
    priority = NotificationPriority.NORMAL
    if "rejected" in norm_status.lower() or "revision" in norm_status.lower():
        priority = NotificationPriority.URGENT

    title = f"Project Evaluation: {project.title} ({norm_status.title()})"
    message = (
        f"Professor {faculty.full_name} has {norm_status} your project '{project.title}'. "
        + (f"Score: {total_score}/100. " if total_score is not None else "")
        + f"Feedback: \"{(faculty_feedback[:120] + '...') if faculty_feedback and len(faculty_feedback) > 120 else (faculty_feedback or 'See details.')}\""
    )
    if evaluation_file_name:
        message += f" [File Attached: {evaluation_file_name}]"

    await create_single_notification(
        db=db,
        title=title,
        message=message,
        notification_type=NotificationType.FACULTY_EVALUATION,
        sender_id=faculty.id,
        sender_role=UserRole.PROFESSOR.value,
        sender_name=faculty.full_name,
        recipient_id=project.owner_id,
        recipient_role=UserRole.STUDENT.value,
        priority=priority,
        related_project_id=project.id,
        attachment_url=evaluation_file_url,
        attachment_name=evaluation_file_name,
        metadata_json=metadata,
        actor=faculty,
    )
    logger.info(f"✅ Real-time evaluation notification sent to Student {project.owner_id} for project {project.id}")


# ---------------------------------------------------------------------------
# Requirement 3: Admin Broadcast Dispatcher
# ---------------------------------------------------------------------------

async def dispatch_admin_broadcast(
    db: AsyncSession,
    admin: User,
    title: str,
    message: str,
    target_audience: NotificationTarget,
    target_user_ids: Optional[List[uuid.UUID]] = None,
    priority: NotificationPriority = NotificationPriority.NORMAL,
    attachment_url: Optional[str] = None,
    attachment_name: Optional[str] = None,
    scheduled_for: Optional[datetime] = None,
) -> uuid.UUID:
    """
    Creates broadcast notifications for each target recipient, logs audit trails,
    and pushes live updates across student & faculty dashboards simultaneously.
    """
    broadcast_id = uuid.uuid4()

    # Query recipients based on target_audience
    stmt = select(User).where(User.is_active == True)
    
    if target_audience == NotificationTarget.STUDENTS:
        stmt = stmt.where(User.role == UserRole.STUDENT)
    elif target_audience == NotificationTarget.FACULTY:
        stmt = stmt.where(User.role == UserRole.PROFESSOR)
    elif target_audience == NotificationTarget.INDIVIDUAL and target_user_ids:
        stmt = stmt.where(User.id.in_(target_user_ids))
    # NotificationTarget.ALL includes both students and faculty

    res = await db.execute(stmt)
    recipients = res.scalars().all()

    if not recipients:
        logger.warning(f"Admin broadcast {broadcast_id} had 0 matching active recipients for audience {target_audience}")

    metadata = {
        "broadcast_id": str(broadcast_id),
        "target_audience": target_audience.value,
        "admin_name": admin.full_name,
        "admin_email": admin.email,
        "is_broadcast": True,
        "scheduled_for": scheduled_for.isoformat() if scheduled_for else None,
    }

    # Create individual notification rows for read receipt and archive tracking
    for r in recipients:
        notif = Notification(
            broadcast_id=broadcast_id,
            sender_id=admin.id,
            sender_role=UserRole.ADMIN.value,
            sender_name=f"Admin: {admin.full_name}",
            recipient_id=r.id,
            recipient_role=r.role.value,
            type=NotificationType.ADMIN_BROADCAST,
            priority=priority,
            title=title,
            message=message,
            attachment_url=attachment_url,
            attachment_name=attachment_name,
            metadata_json=metadata,
            is_read=False,
            is_archived=False,
            is_delivered=True,
            scheduled_for=scheduled_for,
        )
        db.add(notif)

    await db.flush()

    # Log master audit entry
    await log_notification_audit(
        db=db,
        action="ADMIN_BROADCAST_DISPATCHED",
        actor_id=admin.id,
        actor_role=admin.role.value,
        actor_name=admin.full_name,
        broadcast_id=broadcast_id,
        details={
            "title": title,
            "target_audience": target_audience.value,
            "priority": priority.value,
            "recipient_count": len(recipients),
            "attachment_name": attachment_name,
        },
    )

    # Real-time WebSocket dispatch to all recipients
    ws_payload = {
        "event": "new_notification",
        "notification": {
            "broadcast_id": str(broadcast_id),
            "type": NotificationType.ADMIN_BROADCAST.value,
            "priority": priority.value,
            "title": title,
            "message": message,
            "sender_name": f"Admin: {admin.full_name}",
            "sender_role": UserRole.ADMIN.value,
            "attachment_url": attachment_url,
            "attachment_name": attachment_name,
            "metadata_json": metadata,
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    }

    if target_audience == NotificationTarget.STUDENTS:
        await manager.broadcast_to_role("student", ws_payload)
    elif target_audience == NotificationTarget.FACULTY:
        await manager.broadcast_to_role("professor", ws_payload)
    elif target_audience == NotificationTarget.INDIVIDUAL and target_user_ids:
        for uid in target_user_ids:
            await manager.send_personal_message(str(uid), ws_payload)
    else:
        # ALL
        await manager.broadcast_to_all(ws_payload)

    logger.info(f"📢 Broadcast {broadcast_id} dispatched to {len(recipients)} recipients ({target_audience.value})")
    return broadcast_id
