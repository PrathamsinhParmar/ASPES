"""
AI Feedback Generation Package
==============================

Replaces the monolithic, heuristic-only feedback generator with a structured,
LLM-powered pipeline.

Usage:
    from app.ai_engine.feedback import FeedbackGenerator
    
    gen = FeedbackGenerator()
    result = await gen.generate(
        code_zip="path/to/project.zip",
        report_file="path/to/report.pdf",
        metrics=analysis_results_dict
    )
    
    narrative_markdown = result.narrative_md
    json_data = result.structured_json.model_dump()
"""

from .generator import FeedbackGenerator
from .models import FeedbackResponse, FeedbackResult

__all__ = [
    "FeedbackGenerator",
    "FeedbackResponse",
    "FeedbackResult",
]
