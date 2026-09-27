import pytest
import uuid
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.database.connection import AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.project import Project, ProjectStatus
from app.models.evaluation import Evaluation, EvaluationStatus
from app.models.notification import (
    Notification,
    NotificationType,
    NotificationPriority,
    NotificationTarget,
    NotificationAuditLog,
)
from app.services.notification_service import (
    create_single_notification,
    notify_faculty_on_project_submission,
    notify_student_on_faculty_evaluation,
    dispatch_admin_broadcast,
)
from app.utils.security import create_access_token, hash_password


@pytest.mark.asyncio
async def test_notification_creation_and_lifecycle():
    async with AsyncSessionLocal() as db:
        # Create student and faculty
        uid_s = uuid.uuid4()
        uid_f = uuid.uuid4()
        
        student = User(
            id=uid_s,
            email=f"test_student_{uid_s.hex[:6]}@example.com",
            username=f"student_{uid_s.hex[:6]}",
            full_name="Alice Student",
            hashed_password=hash_password("password123"),
            role=UserRole.STUDENT,
            is_active=True,
        )
        faculty = User(
            id=uid_f,
            email=f"test_faculty_{uid_f.hex[:6]}@example.com",
            username=f"faculty_{uid_f.hex[:6]}",
            full_name="Dr. Bob Faculty",
            hashed_password=hash_password("password123"),
            role=UserRole.PROFESSOR,
            is_active=True,
        )
        db.add_all([student, faculty])
        await db.commit()

        # 1. Test Project Submission Trigger -> Faculty
        project = Project(
            id=uuid.uuid4(),
            title="AI Image Generator",
            description="A modern generative AI system",
            status=ProjectStatus.SUBMITTED,
            owner_id=student.id,
            faculty_id=faculty.id,
            course_name="Machine Learning",
            submitted_at=datetime.now(timezone.utc),
        )
        db.add(project)
        await db.commit()

        await notify_faculty_on_project_submission(db, project, student)
        await db.commit()

        # Verify faculty received notification
        notifs = (
            await db.execute(
                pytest.importorskip("sqlalchemy").select(Notification).where(Notification.recipient_id == faculty.id)
            )
        ).scalars().all()

        assert len(notifs) >= 1
        sub_notif = notifs[0]
        assert sub_notif.type == NotificationType.PROJECT_SUBMISSION
        assert "Alice Student" in sub_notif.message
        assert sub_notif.metadata_json["student_name"] == "Alice Student"
        assert sub_notif.metadata_json["course_name"] == "Machine Learning"
        assert not sub_notif.is_read

        # 2. Test Faculty Evaluation Trigger -> Student
        evaluation = Evaluation(
            id=uuid.uuid4(),
            project_id=project.id,
            evaluator_id=faculty.id,
            status=EvaluationStatus.COMPLETED,
            total_score=94.5,
            code_quality_score=95.0,
            documentation_score=92.0,
            plagiarism_score=98.0,
            report_alignment_score=93.0,
            professor_feedback="Outstanding implementation with clean modular code!",
        )
        db.add(evaluation)
        await db.commit()

        await notify_student_on_faculty_evaluation(
            db=db,
            project=project,
            faculty=faculty,
            status_label="approved",
            faculty_feedback=evaluation.professor_feedback,
            faculty_score=94.5,
            evaluation_record=evaluation,
        )
        await db.commit()

        # Verify student received evaluation notification
        student_notifs = (
            await db.execute(
                pytest.importorskip("sqlalchemy").select(Notification).where(Notification.recipient_id == student.id)
            )
        ).scalars().all()

        assert len(student_notifs) >= 1
        eval_notif = student_notifs[0]
        assert eval_notif.type == NotificationType.FACULTY_EVALUATION
        assert eval_notif.metadata_json["score"] == 94.5
        assert eval_notif.metadata_json["evaluation_status"] == "approved"
        assert "Outstanding implementation" in eval_notif.metadata_json["feedback"]


@pytest.mark.asyncio
async def test_admin_broadcast_and_read_receipts():
    async with AsyncSessionLocal() as db:
        # Create admin and test users
        uid_admin = uuid.uuid4()
        admin = User(
            id=uid_admin,
            email=f"admin_{uid_admin.hex[:6]}@example.com",
            username=f"admin_{uid_admin.hex[:6]}",
            full_name="System Admin",
            hashed_password=hash_password("adminpass123"),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin)
        await db.commit()

        # Dispatch broadcast
        b_id = await dispatch_admin_broadcast(
            db=db,
            admin=admin,
            title="Institutional Policy Update",
            message="Please submit all milestone reports before Friday 5 PM.",
            target_audience=NotificationTarget.ALL,
            priority=NotificationPriority.URGENT,
        )
        await db.commit()

        assert b_id is not None

        # Verify audit log was recorded
        audit = (
            await db.execute(
                pytest.importorskip("sqlalchemy").select(NotificationAuditLog).where(
                    NotificationAuditLog.broadcast_id == b_id
                )
            )
        ).scalar_one_or_none()

        assert audit is not None
        assert audit.action == "ADMIN_BROADCAST_DISPATCHED"
        assert audit.actor_id == admin.id
