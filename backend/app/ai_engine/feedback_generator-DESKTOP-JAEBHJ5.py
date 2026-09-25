"""
Backward-compatibility shim for the old feedback_generator.py

This module replaces the monolithic heuristic generator. It's kept around so
any old imports of `EnhancedFeedbackGenerator` don't break, though new code
should use `app.ai_engine.feedback.FeedbackGenerator` directly.
"""

from typing import Dict, Any
from app.ai_engine.feedback import FeedbackGenerator as _FG
import asyncio

class EnhancedFeedbackGenerator:
    """
    DEPRECATED: Use app.ai_engine.feedback.FeedbackGenerator instead.
    This class is provided only for backward compatibility.
    """
    
    def generate_comprehensive_feedback(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Warning: This shim generates feedback ONLY from metrics (heuristic fallback).
        It does not receive the raw code/report, so the LLM cannot be used effectively.
        """
        from app.ai_engine.feedback.fallback import generate_heuristic_feedback
        from app.ai_engine.feedback.narrative_renderer import render_narrative
        
        # We don't have code_zip or report_file here, so we must fall back
        # to the heuristic generator directly to simulate the old behavior.
        response = generate_heuristic_feedback(analysis_results)
        narrative = render_narrative(response)
        
        return {
            "overall_feedback": narrative,
            "narrative_feedback": narrative,
            "structured_feedback": response.model_dump(),
            "improvement_plan": [r.action for r in response.actionable_recommendations]
        }
