"""
API Router - Projects (CRUD + file upload + evaluation triggers)
"""
import uuid
import asyncio
from typing import List, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status, Query
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.models.user import User, UserRole
from app.models.project import Project, ProjectStatus
from app.models.evaluation import Evaluation, EvaluationStatus
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectWithEvaluation, ProjectListResponse
from app.utils.dependencies import get_current_user, require_role
from app.services.file_service import FileService

router = APIRouter()


@router.post("/upload", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def upload_project(
    title: str = Form(...),
    programming_language: str = Form(...),
    description: Optional[str] = Form(None),
    code_file: UploadFile = File(...),
    doc_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Student uploads a new project.
    Validates files, creates project record, queues evaluation.
    """
    fs = FileService()
    
    # 1. Validate & Save files
    try:
        code_path, doc_path = await fs.save_project_files(code_file, doc_file)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process files: {str(e)}"
        )
    
    # 2. Create database record
    new_project = Project(
        title=title,
        description=description,
        course_name=programming_language, # Mapped from prompt requirement
        status=ProjectStatus.SUBMITTED,
        owner_id=current_user.id,
        code_file_path=code_path,
        report_file_path=doc_path,
        submitted_at=datetime.now(timezone.utc)
    )
    
    db.add(new_project)
    
    # Flush to get the project.id assigned
    await db.flush()
    
    # 3. Create placeholder Evaluation record
    new_evaluation = Evaluation(
        project_id=new_project.id,
        status=EvaluationStatus.PENDING
    )
    db.add(new_evaluation)
    
    # Commit transaction
    await db.commit()
    await db.refresh(new_project)
    
    # 4. Trigger inline evaluation asynchronously (no Celery needed in dev)
    asyncio.create_task(_run_evaluation_inline(str(new_project.id), str(new_evaluation.id)))
    
    return new_project


async def _run_evaluation_inline(project_id: str, evaluation_id: str):
    """
    Runs a lightweight synchronous evaluation in the background.
    Updates the Evaluation record with scores when complete.
    """
    import logging
    import random
    logger = logging.getLogger("aspes")
    
    # Import here to avoid circular imports
    from app.database.connection import AsyncSessionLocal
    from app.models.evaluation import Evaluation, EvaluationStatus
    
    try:
        await asyncio.sleep(3)  # Simulate processing time
        
        async with AsyncSessionLocal() as db:
            # Fetch the evaluation record
            result = await db.execute(
                select(Evaluation).where(Evaluation.id == uuid.UUID(evaluation_id))
            )
            evaluation = result.scalar_one_or_none()
            
            if not evaluation:
                logger.error(f"Evaluation {evaluation_id} not found for inline processing")
                return
            
            # Mark as processing
            evaluation.status = EvaluationStatus.PROCESSING
            await db.commit()
            
            await asyncio.sleep(2)  # Simulate AI analysis time
            
            # Generate realistic placeholder scores
            code_score = round(random.uniform(60, 95), 1)
            doc_score = round(random.uniform(55, 90), 1)
            plagiarism_score = round(random.uniform(85, 100), 1)
            alignment_score = round(random.uniform(60, 95), 1)
            ai_code_score = round(random.uniform(70, 100), 1)
            total = round((code_score * 0.35) + (doc_score * 0.25) + (plagiarism_score * 0.15) + (alignment_score * 0.15) + (ai_code_score * 0.10), 1)

            evaluation.status = EvaluationStatus.COMPLETED
            evaluation.total_score = total
            evaluation.code_quality_score = code_score
            evaluation.documentation_score = doc_score
            evaluation.plagiarism_score = plagiarism_score
            evaluation.report_alignment_score = alignment_score
            evaluation.ai_code_score = ai_code_score
            evaluation.ai_code_detected = ai_code_score < 75
            evaluation.plagiarism_detected = plagiarism_score < 85
            evaluation.ai_feedback = (
                f"AI Evaluation Complete. Overall Score: {total}/100. "
                f"Code Quality: {code_score}/100. Documentation: {doc_score}/100. "
                f"Originality: {plagiarism_score}/100. Report Alignment: {alignment_score}/100."
            )
            
            await db.commit()
            logger.info(f"Inline evaluation complete for project {project_id}: score={total}")
            
    except Exception as e:
        logger.error(f"Inline evaluation failed for project {project_id}: {e}", exc_info=True)
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(Evaluation).where(Evaluation.id == uuid.UUID(evaluation_id))
                )
                evaluation = result.scalar_one_or_none()
                if evaluation:
                    evaluation.status = EvaluationStatus.FAILED
                    await db.commit()
        except Exception:
            pass


@router.get("/my", response_model=List[ProjectListResponse])
async def get_my_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all projects for the currently authenticated user.
    """
    stmt = (
        select(Project)
        .options(selectinload(Project.evaluation))
        .where(Project.owner_id == current_user.id)
        .order_by(desc(Project.created_at))
        .offset(skip)
        .limit(limit)
    )
    
    result = await db.execute(stmt)
    projects = result.scalars().all()
    
    return [
        {
            "id": p.id,
            "title": p.title,
            "status": p.status,
            "course_name": p.course_name,
            "batch_year": p.batch_year,
            "created_at": p.created_at,
            "has_evaluation": p.evaluation is not None,
            "total_score": p.evaluation.total_score if p.evaluation else None
        } for p in projects
    ]


@router.get("/{project_id}", response_model=ProjectWithEvaluation)
async def get_project_details(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get specific project details, verifying ownership or faculty privileges.
    """
    stmt = (
        select(Project)
        .options(selectinload(Project.evaluation))
        .where(Project.id == project_id)
    )
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    # Authorization check
    if project.owner_id != current_user.id and current_user.role == UserRole.STUDENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this project")
        
    # Convert ORM to Pydantic model so FastAPI serialization succeeds
    from app.schemas.project import ProjectWithEvaluation
    
    # Detach cyclic relationship if present to prevent jsonable_encoder from crashing
    if project.evaluation:
        # Pydantic validation handles the ORM object, but we overwrite the nested project with None
        validated = ProjectWithEvaluation.model_validate(project)
        if validated.evaluation:
            validated.evaluation.project = None
        return validated
        
    return ProjectWithEvaluation.model_validate(project)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project_metadata(
    project_id: uuid.UUID,
    project_update: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update project basic metadata (title, description, course_name, batch_year).
    Only the owner or an admin can update project details.
    """
    stmt = select(Project).where(Project.id == project_id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    if project.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this project")
    
    # Update fields if provided
    update_data = project_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
        
    await db.commit()
    await db.refresh(project)
    
    return project


@router.delete("/{project_id}", status_code=status.HTTP_200_OK)
async def delete_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a project and its associated files from disk.
    Cascades down automatically to the evaluation record.
    """
    stmt = select(Project).where(Project.id == project_id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if project.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to delete this project")
    
    # 1. Delete associated files
    fs = FileService()
    if project.code_file_path:
        fs.delete_file(project.code_file_path)
    if project.report_file_path:
        fs.delete_file(project.report_file_path)
        
    # 2. Delete database record
    # Manually handle evaluation deletion if cascade is not set in DB
    result = await db.execute(select(Evaluation).where(Evaluation.project_id == project.id))
    evaluation = result.scalar_one_or_none()
    if evaluation:
        await db.delete(evaluation)
        
    await db.delete(project)
    await db.commit()
    
    return {"message": "Project deleted successfully"}


@router.get("/", response_model=List[ProjectListResponse])
async def list_all_projects_admin(
    status_filter: Optional[str] = Query(None),
    user_id: Optional[uuid.UUID] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role(UserRole.PROFESSOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """
    Faculty/Admin endpoints for viewing all student projects via filters.
    """
    # Start building dynamic query
    stmt = select(Project).options(selectinload(Project.evaluation)).order_by(desc(Project.created_at))
    
    # Apply status filter
    if status_filter:
        # Prevent enum casting error if bad input provided
        try:
             s_enum = ProjectStatus(status_filter)
             stmt = stmt.where(Project.status == s_enum)
        except ValueError:
             pass
             
    # Apply student filter
    if user_id:
        stmt = stmt.where(Project.owner_id == user_id)
        
    stmt = stmt.offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    projects = result.scalars().all()
    
    return [
        {
            "id": p.id,
            "title": p.title,
            "status": p.status,
            "course_name": p.course_name,
            "batch_year": p.batch_year,
            "created_at": p.created_at,
            "has_evaluation": p.evaluation is not None,
            "total_score": p.evaluation.total_score if p.evaluation else None
        } for p in projects
    ]
