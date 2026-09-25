import pytest
from app.ai_engine.feedback.fallback import generate_heuristic_feedback
from app.ai_engine.feedback.models import FeedbackResponse


def test_heuristic_fallback_with_zero_metrics():
    """Ensure it produces a schema-valid response even with 0 metrics."""
    response = generate_heuristic_feedback({
        "code_quality": {"final_score": 0},
        "doc_evaluation": {"final_score": 0},
        "alignment": {"overall_alignment_score": 0},
        "plagiarism": {"originality_score": 0},
        "scoring": {"final_score": 0}
    })
    
    # Assert type
    assert isinstance(response, FeedbackResponse)
    
    # Assert fallback markers
    assert response.meta.generated_by == "heuristic_fallback"
    assert response.meta.confidence == "LOW"
    
    # Assert no invented issues
    assert len(response.code_quality_feedback.issues) == 0
    
    # Assert Pydantic validation passes (implicit since it returns a FeedbackResponse)
    assert response.scores.overall == 0.0
    assert response.executive_summary.overall_grade_suggestion == "F"


def test_heuristic_fallback_with_good_metrics():
    """Ensure score thresholds trigger the right feedback text."""
    metrics = {
        "code_quality": {"final_score": 90, "complexity": 15},
        "doc_evaluation": {"final_score": 85},
        "alignment": {"overall_alignment_score": 95},
        "plagiarism": {"originality_score": 100, "risk_level": "LOW"},
        "scoring": {"final_score": 92.5}
    }
    
    response = generate_heuristic_feedback(metrics)
    
    assert response.scores.overall == 92.5
    assert response.executive_summary.overall_grade_suggestion == "A"
    assert "Clean" in response.code_quality_feedback.summary or "clean" in response.code_quality_feedback.summary.lower()
    
    # No plagiarism warning
    assert response.originality_feedback.requires_manual_review is False
    assert response.instructor_notes is None


def test_heuristic_fallback_plagiarism_warning():
    """Ensure high risk plagiarism correctly populates instructor notes."""
    metrics = {
        "plagiarism": {
            "originality_score": 40,
            "max_similarity_percent": 80.5,
            "risk_level": "HIGH",
            "flagged": True
        }
    }
    
    response = generate_heuristic_feedback(metrics)
    
    assert response.originality_feedback.requires_manual_review is True
    assert response.originality_feedback.risk_level == "HIGH"
    
    assert response.instructor_notes is not None
    assert "Plagiarism" in response.instructor_notes
    assert "80.5%" in response.instructor_notes
