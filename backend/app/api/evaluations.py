from typing import List, Optional, cast
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.connection import get_db
from app.utils.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.project import Project, ProjectStatus
from app.models.evaluation import Evaluation, EvaluationStatus
from app.schemas.evaluation import EvaluationResponse, EvaluationFinalize, EvaluationStatistics

from app.tasks.evaluation_tasks import evaluate_project_async

router = APIRouter()


@router.get("/statistics", response_model=EvaluationStatistics)
async def get_evaluation_statistics(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive evaluation statistics (Admin only).
    """
    stmt = select(Evaluation).where(Evaluation.status == EvaluationStatus.COMPLETED)
    result = await db.execute(stmt)
    evaluations = result.scalars().all()
    
    total = len(evaluations)
    if total == 0:
        return EvaluationStatistics(
            average_total_score=0.0,
            average_code_quality=0.0,
            average_documentation=0.0,
            average_plagiarism=0.0,
            average_report_alignment=0.0,
            grade_distribution={},
            ai_detection_flags=0,
            plagiarism_flags=0,
            total_evaluations=0
        )
        
    avg_total = sum(e.total_score or 0 for e in evaluations) / total
    avg_code = sum(e.code_quality_score or 0 for e in evaluations) / total
    avg_doc = sum(e.documentation_score or 0 for e in evaluations) / total
    avg_plag = sum(e.plagiarism_score or 0 for e in evaluations) / total
    avg_align = sum(e.report_alignment_score or 0 for e in evaluations) / total
    
    ai_flags = sum(1 for e in evaluations if e.ai_code_detected)
    plag_flags = sum(1 for e in evaluations if e.plagiarism_detected)
    
    grade_dist = {}
    for e in evaluations:
        grade = e.project.evaluation.letter_grade if getattr(e, "letter_grade", None) else "N/A"
        # Since letter_grade isn't directly on Evaluation model we stored total_score. We will map basic letters.
        # But wait, did we store letter_grade on Evaluation? We didn't, but let's derive it or group by 10s.
        if e.total_score is None:
            g = "N/A"
        elif e.total_score >= 90: g = "A"
        elif e.total_score >= 80: g = "B"
        elif e.total_score >= 70: g = "C"
        elif e.total_score >= 60: g = "D"
        else: g = "F"
        
        grade_dist[g] = grade_dist.get(g, 0) + 1
        
    return EvaluationStatistics(
        average_total_score=avg_total,
        average_code_quality=avg_code,
        average_documentation=avg_doc,
        average_plagiarism=avg_plag,
        average_report_alignment=avg_align,
        grade_distribution=grade_dist,
        ai_detection_flags=ai_flags,
        plagiarism_flags=plag_flags,
        total_evaluations=total
    )


@router.get("/pending", response_model=List[EvaluationResponse])
async def get_pending_evaluations(
    faculty_id: Optional[uuid.UUID] = Query(None, description="Filter by assigned faculty"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_role(UserRole.PROFESSOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """
    Get pending evaluations for faculty review.
    Evaluated projects which are NOT finalized yet.
    """
    stmt = (
        select(Evaluation)
        .options(selectinload(Evaluation.project))
        .join(Project, Project.id == Evaluation.project_id)
        .where(Evaluation.is_finalized == False)
        .where(Evaluation.status == EvaluationStatus.COMPLETED)
    )

    if current_user.role == UserRole.PROFESSOR:
        stmt = stmt.where(Project.faculty_id == current_user.id)
    elif current_user.role == UserRole.ADMIN and faculty_id is not None:
        stmt = stmt.where(Project.faculty_id == faculty_id)

    stmt = stmt.order_by(desc(Evaluation.completed_at)).offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    evaluations = result.scalars().all()
    validated_evals = []
    for ev in evaluations:
        v = EvaluationResponse.model_validate(ev)
        if v.project:
            v.project = {
                "id": str(v.project.id),
                "title": v.project.title,
                "status": v.project.status
            }
        validated_evals.append(v)
    return validated_evals


@router.get("/{evaluation_id}", response_model=EvaluationResponse)
async def get_evaluation(
    evaluation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get specific evaluation details.
    """
    stmt = (
        select(Evaluation)
        .options(selectinload(Evaluation.project))
        .where(Evaluation.id == evaluation_id)
    )
    result = await db.execute(stmt)
    evaluation = result.scalars().first()
    
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
        
    # Check permissions
    if current_user.role == UserRole.STUDENT:
        if evaluation.project.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this evaluation")
            
    validated = EvaluationResponse.model_validate(evaluation)
    if validated.project:
        validated.project = {
            "id": str(validated.project.id),
            "title": validated.project.title,
            "status": validated.project.status
        }
    return validated


@router.put("/{evaluation_id}/finalize", response_model=EvaluationResponse)
async def finalize_evaluation(
    evaluation_id: uuid.UUID,
    finalize_data: EvaluationFinalize,
    current_user: User = Depends(require_role(UserRole.PROFESSOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """
    Finalize an evaluation and publish results.
    """
    stmt = select(Evaluation).options(selectinload(Evaluation.project)).where(Evaluation.id == evaluation_id)
    result = await db.execute(stmt)
    evaluation = result.scalars().first()
    
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
        
    if evaluation.is_finalized:
        raise HTTPException(status_code=400, detail="Evaluation is already finalized")
        
    # Update evaluation
    if finalize_data.faculty_comments is not None:
        evaluation.professor_feedback = finalize_data.faculty_comments
        
    if finalize_data.modified_score is not None:
        evaluation.professor_score_override = finalize_data.modified_score
        
    evaluation.is_finalized = finalize_data.is_finalized
    evaluation.finalized_by = current_user.id
    evaluation.finalized_at = datetime.utcnow()
    
    # Update project status
    if finalize_data.is_finalized:
        evaluation.project.status = ProjectStatus.PUBLISHED
        
    await db.commit()
    await db.refresh(evaluation)
    
    # TODO: Send notification to student via email background task
    
    validated = EvaluationResponse.model_validate(evaluation)
    if validated.project:
        validated.project = {
            "id": str(validated.project.id),
            "title": validated.project.title,
            "status": validated.project.status
        }
    return validated


@router.post("/{evaluation_id}/reprocess")
async def reprocess_evaluation(
    evaluation_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """
    Reset evaluation and re-trigger async analysis (Admin only).
    """
    stmt = select(Evaluation).options(selectinload(Evaluation.project)).where(Evaluation.id == evaluation_id)
    result = await db.execute(stmt)
    evaluation = result.scalars().first()
    
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
        
    # Reset
    evaluation.status = EvaluationStatus.PENDING
    evaluation.is_finalized = False
    evaluation.project.status = ProjectStatus.SUBMITTED
    
    await db.commit()
    
    # Re-trigger Task
    task = evaluate_project_async.delay(str(evaluation.project_id))
    
    return {
        "detail": "Reprocessing triggered successfully",
        "task_id": task.id
    }
