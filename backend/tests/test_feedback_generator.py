import pytest
import os
import json
import hashlib
from unittest.mock import patch, MagicMock, mock_open
from app.ai_engine.feedback_generator import EnhancedFeedbackGenerator

# --- Mock Data Factory ---

class MockFeedbackData:
    @staticmethod
    def get_perfect_results():
        """Simulates a top-tier project with no issues."""
        return {
            "code_quality": {
                "final_score": 95,
                "complexity_score": 90,
                "maintainability_score": 95,
                "details": {"pylint_issues": []}
            },
            "doc_evaluation": {
                "final_score": 90,
                "completeness": 95,
                "clarity": 90,
                "missing_sections": []
            },
            "alignment": {
                "overall_alignment_score": 95,
                "mismatches": [],
                "missing_features": []
            },
            "ai_detection": {
                "verdict": "HUMAN_WRITTEN",
                "ai_generated_probability": 0.05,
                "flags": []
            },
            "plagiarism": {
                "originality_score": 100,
                "max_similarity_percent": 5.0,
                "risk_level": "LOW"
            }
        }

    @staticmethod
    def get_failing_results():
        """Simulates a poor project with plagiarism and AI detection."""
        return {
            "code_quality": {
                "final_score": 40,
                "complexity_score": 30,
                "maintainability_score": 40,
                "details": {"pylint_issues": ["E0001", "W0311"]}
            },
            "doc_evaluation": {
                "final_score": 30,
                "completeness": 20,
                "clarity": 30,
                "missing_sections": ["Installation", "Usage"]
            },
            "alignment": {
                "overall_alignment_score": 30,
                "mismatches": ["PostgreSQL mentioned but not used"],
                "missing_features": ["User Login"]
            },
            "ai_detection": {
                "verdict": "LIKELY_AI",
                "ai_generated_probability": 0.95,
                "flags": ["Repetitive patterns"]
            },
            "plagiarism": {
                "originality_score": 20,
                "max_similarity_percent": 85.0,
                "risk_level": "HIGH"
            }
        }

    @staticmethod
    def get_minimal_results():
        """Edge case: Empty or missing fields."""
        return {}

# --- Fixtures ---

@pytest.fixture
def generator():
    # Patch Gemini init to avoid actual API calls during instantiation
    with patch("app.ai_engine.feedback_generator.os.getenv", return_value=None):
        return EnhancedFeedbackGenerator()

# --- Test Classes ---

class TestEnhancedFeedbackGeneratorHeuristics:
    """Validates the heuristic feedback logic (non-LLM)."""

    def test_overall_assessment_excellent(self, generator):
        results = MockFeedbackData.get_perfect_results()
        assessment = generator._generate_overall_assessment(results)
        assert "Excellent" in assessment

    def test_overall_assessment_poor(self, generator):
        results = MockFeedbackData.get_failing_results()
        assessment = generator._generate_overall_assessment(results)
        assert "significant revision" in assessment.lower()

    def test_originality_feedback_critical(self, generator):
        ai = {"verdict": "LIKELY_AI"}
        plag = {"max_similarity_percent": 85.0}
        feedback = generator._generate_originality_feedback(ai, plag)
        assert "CRITICAL" in feedback

    def test_originality_feedback_clean(self, generator):
        ai = {"verdict": "HUMAN"}
        plag = {"max_similarity_percent": 10.0}
        feedback = generator._generate_originality_feedback(ai, plag)
        assert "Clear" in feedback

    def test_identify_strengths(self, generator):
        results = MockFeedbackData.get_perfect_results()
        strengths = generator._identify_strengths(results)
        assert len(strengths) >= 4
        assert "maintainability" in strengths[0].lower()

    def test_estimate_improvement_time(self, generator):
        items = [
            {"estimated_time": "2-4 hours"},
            {"estimated_time": "1-2 hours"}
        ]
        time_est = generator._estimate_improvement_time(items)
        # Total upper bound = 4 + 2 = 6 -> "5-10 hours"
        assert time_est == "5-10 hours"

class TestEnhancedFeedbackGeneratorLLM:
    """Validates LLM integration, caching, and fallbacks."""

    def test_fallback_narrative_feedback(self, generator):
        results = MockFeedbackData.get_failing_results()
        feedback = generator._fallback_narrative_feedback(results)
        assert "### Areas for Improvement:" in feedback
        assert "Installation" in feedback

    @patch("app.ai_engine.feedback_generator.EnhancedFeedbackGenerator._fallback_narrative_feedback")
    def test_generate_narrative_no_api_key(self, mock_fallback, generator):
        generator.client = None
        generator._generate_narrative_feedback({})
        mock_fallback.assert_called_once()

    @patch("app.ai_engine.feedback_generator.hashlib.sha256")
    def test_cache_mechanism(self, mock_sha, generator):
        # Simulate a cached response
        mock_hash = MagicMock()
        mock_hash.hexdigest.return_value = "fixed_hash"
        mock_sha.return_value = mock_hash
        
        generator._cache["fixed_hash"] = "Cached Feedback"
        
        generator.client = True
        generator.model = MagicMock()
        result = generator._generate_narrative_feedback({})
        
        assert result == "Cached Feedback"
        generator.model.generate_content.assert_not_called()

class TestEnhancedFeedbackGeneratorIntegration:
    """Integration test for the main orchestration method."""

    def test_generate_comprehensive_feedback_flow(self, generator):
        results = MockFeedbackData.get_perfect_results()
        output = generator.generate_comprehensive_feedback(results)
        
        assert "structured_feedback" in output
        assert "narrative_feedback" in output
        assert "priority_items" in output
        assert len(output["structured_feedback"]["strengths"]) > 0

    def test_generate_comprehensive_feedback_empty_input(self, generator):
        output = generator.generate_comprehensive_feedback({})
        assert output["estimated_improvement_time"] == "Less than 1 hour"
        assert "overall_assessment" in output["structured_feedback"]

# --- Error Handling ---

class TestEnhancedFeedbackGeneratorErrors:
    """Validates exception handling during LLM calls."""

    @patch("time.sleep", return_value=None) # Speed up test
    def test_llm_api_failure_retry_and_fallback(self, mock_sleep, generator):
        generator.client = True
        generator.model = MagicMock()
        generator.model.generate_content.side_effect = Exception("API Error")
        
        results = MockFeedbackData.get_perfect_results()
        # Should retry 3 times and then fallback
        output = generator._generate_narrative_feedback(results)
        
        assert generator.model.generate_content.call_count == 3
        # Should contain fallback text
        assert "Key Strengths" in output
