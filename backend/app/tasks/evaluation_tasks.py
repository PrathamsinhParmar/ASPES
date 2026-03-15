import asyncio
import logging
import os
import uuid
from datetime import datetime
from typing import List, Dict, Any

from celery import Celery
from sqlalchemy import select

from app.database.connection import AsyncSessionLocal
from app.models.project import Project, ProjectStatus
from app.models.evaluation import Evaluation, EvaluationStatus
from app.ai_engine.comprehensive_scorer import EnhancedProjectEvaluator

logger = logging.getLogger(__name__)

# Initialize Celery
# Default config relies on Redis
broker_url = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
result_backend = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/1')

celery_app = Celery(
    'aspes_tasks',
    broker=broker_url,
    backend=result_backend
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

async def _get_existing_projects(db, current_project_id: uuid.UUID) -> List[Dict[str, Any]]:
    """
    Fetch existing evaluated projects for plagiarism detection comparison.
    """
    stmt = select(Project).where(
        Project.id != current_project_id,
        Project.status == ProjectStatus.EVALUATED
    )
    result = await db.execute(stmt)
    projects = result.scalars().all()
    
    existing_list = []
    for proj in projects:
        if not proj.code_file_path or not os.path.exists(proj.code_file_path):
            continue
            
        try:
            with open(proj.code_file_path, 'r', encoding='utf-8', errors='ignore') as f:
                code_content = f.read()
                
            # In a real app we might load student name from proj.owner
            existing_list.append({
                'id': str(proj.id),
                'code': code_content,
                'student_name': 'Student'
            })
        except Exception as e:
            logger.warning(f"Failed to read project {proj.id} for comparison: {e}")
            
    return existing_list

async def _process_evaluation(task_id: str, project_id_str: str):
    """
    Async core runner for the evaluation to handle SQLAlchemy async sessions.
    """
    project_id = uuid.UUID(project_id_str)
    
    async with AsyncSessionLocal() as db:
        try:
            logger.info(f"Task {task_id}: Starting async evaluation for {project_id}")
            
            # 1. Fetch project
            result = await db.execute(select(Project).where(Project.id == project_id))
            project = result.scalars().first()
            if not project:
                raise Exception(f"Project not found: {project_id}")
                
            # 2. Update status to PROCESSING
            project.status = ProjectStatus.UNDER_EVALUATION
            await db.commit()
            
            # Fetch existing projects
            existing_projects = await _get_existing_projects(db, project_id)
            
            # 3. Setup evaluator 
            evaluator = EnhancedProjectEvaluator()
            
            project_data = {
                'id': str(project.id),
                'title': project.title,
                'code_file_path': project.code_file_path,
                'doc_file_path': project.report_file_path,
                'existing_projects': existing_projects
            }
            
            # 4. Run Analysis (This is sync intensive work, ideally run in threadpool)
            # but evaluator handles it iteratively
            loop = asyncio.get_running_loop()
            results = await loop.run_in_executor(None, evaluator.evaluate_project, project_data)
            
            # 5. Create or Update Evaluation Record
            eval_result = await db.execute(select(Evaluation).where(Evaluation.project_id == project_id))
            evaluation = eval_result.scalars().first()
            
            if not evaluation:
                evaluation = Evaluation(project_id=project_id)
                db.add(evaluation)
                
            evaluation.celery_task_id = task_id
            evaluation.status = EvaluationStatus.COMPLETED
            evaluation.total_score = results.get('scoring', {}).get('final_score')
            evaluation.code_quality_score = results.get('code_quality', {}).get('final_score')
            evaluation.documentation_score = results.get('doc_evaluation', {}).get('final_score')
            evaluation.plagiarism_score = results.get('plagiarism', {}).get('originality_score')
            evaluation.report_alignment_score = results.get('alignment', {}).get('overall_alignment_score')
            
            # Using ai_authenticity from comprehensive scorer
            evaluation.ai_code_score = results.get('scoring', {}).get('component_scores', {}).get('ai_authenticity')
            
            # Flags
            evaluation.ai_code_detected = 'LIKELY_AI' in results.get('ai_detection', {}).get('verdict', '')
            evaluation.plagiarism_detected = results.get('plagiarism', {}).get('flagged', False)
            
            # JSON Blocks
            evaluation.code_analysis_result = results.get('code_quality')
            evaluation.doc_evaluation_result = results.get('doc_evaluation')
            evaluation.plagiarism_result = results.get('plagiarism')
            evaluation.alignment_result = results.get('alignment')
            evaluation.ai_detection_result = results.get('ai_detection')
            
            # Derived textual feedback
            evaluation.ai_feedback = results.get('feedback', {}).get('narrative_feedback')
            evaluation.completed_at = datetime.utcnow()
            
            project.status = ProjectStatus.EVALUATED
            await db.commit()
            
            logger.info(f"Task {task_id}: Evaluation complete for {project_id}.")
            return {
                'status': 'success',
                'project_id': str(project_id),
                'final_score': evaluation.total_score,
                'celery_task_id': task_id
            }
            
        except Exception as e:
            logger.error(f"Task {task_id}: Evaluation error - {e}")
            await db.rollback()
            
            # Try to mark project as failed if possible
            try:
                result = await db.execute(select(Project).where(Project.id == project_id))
                failed_proj = result.scalars().first()
                if failed_proj:
                    failed_proj.status = ProjectStatus.RETURNED # Mark as returned or error
                    await db.commit()
            except Exception:
                pass
                
            raise e

@celery_app.task(bind=True, max_retries=3)
def evaluate_project_async(self, project_id: str):
    """
    Celery wrapper to run async db and evaluation tasks in a synchronous worker.
    """
    try:
        # Create a new event loop for this synchronous task
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        result = loop.run_until_complete(_process_evaluation(self.request.id, project_id))
        loop.close()
        return result
    except Exception as exc:
        logger.error(f"Task failed, retrying. Error: {exc}")
        raise self.retry(exc=exc, countdown=60)

@celery_app.task
def cleanup_old_files(days: int = 90):
    """
    Periodic task to clean up old projects, zip files, or uploads over `days` old.
    Placeholder.
    """
    logger.info(f"Cleanup old files older than {days} days")
    return {"status": "success", "cleaned": 0}

def _send_evaluation_notification(project, results: dict):
    """
    Send email notification to faculty or student
    """
    pass
