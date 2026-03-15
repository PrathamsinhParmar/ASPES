# backend/app/tasks/__init__.py
from .evaluation_tasks import celery_app, evaluate_project_async, cleanup_old_files

__all__ = ['celery_app', 'evaluate_project_async', 'cleanup_old_files']
