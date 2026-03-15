import pytest
from unittest.mock import patch, MagicMock, mock_open
from app.ai_engine.comprehensive_scorer import ComprehensiveScorer, EnhancedProjectEvaluator

# --- Mock Data Factory ---

class MockEvaluationData:
    @staticmethod
    def get_perfect_results():
        return {
            'code_quality': {'final_score': 100.0},
            'doc_evaluation': {'final_score': 100.0},
            'alignment': {'overall_alignment_score': 100.0, 'missing_features': []},
            'plagiarism': {'originality_score': 100.0, 'flagged': False, 'max_similarity_percent': 0.0},
            'ai_detection': {'ai_generated_probability': 0.0, 'verdict': 'HUMAN_WRITTEN'},
            'functionality': {'score': 100.0}
        }

    @staticmethod
    def get_failing_results():
        return {
            'code_quality': {'final_score': 20.0},
            'doc_evaluation': {'final_score': 10.0},
            'alignment': {'overall_alignment_score': 10.0, 'missing_features': ['login', 'logout']},
            'plagiarism': {'originality_score': 10.0, 'flagged': True, 'max_similarity_percent': 95.0},
            'ai_detection': {'ai_generated_probability': 0.95, 'verdict': 'LIKELY_AI'},
            'functionality': {'score': 0.0}
        }

# --- Fixtures ---

@pytest.fixture
def scorer():
    return ComprehensiveScorer()

@pytest.fixture
def perfect_results():
    return MockEvaluationData.get_perfect_results()

@pytest.fixture
def failing_results():
    return MockEvaluationData.get_failing_results()

# --- Unit Tests: ComprehensiveScorer ---

class TestComprehensiveScorer:
    """Unit tests for scoring logic, math, and grading."""

    def test_calculate_authenticity_score(self, scorer):
        """Validates conversion from AI probability to authenticity score."""
        assert scorer._calculate_authenticity_score(0.0) == 100.0
        assert scorer._calculate_authenticity_score(1.0) == 0.0
        assert scorer._calculate_authenticity_score(0.25) == 75.0

    def test_get_letter_grade(self, scorer):
        """Validates letter grade mapping."""
        assert scorer._get_letter_grade(100.0) == 'A+'
        assert scorer._get_letter_grade(95.0) == 'A'
        assert scorer._get_letter_grade(85.0) == 'B'
        assert scorer._get_letter_grade(70.0) == 'C-'
        assert scorer._get_letter_grade(50.0) == 'F'

    def test_apply_penalties_plagiarism(self, scorer):
        """Tests heavy deduction for plagiarism."""
        results = {'plagiarism': {'flagged': True}}
        new_score, penalties = scorer._apply_penalties(100.0, results)
        assert new_score == 80.0
        assert any("Plagiarism" in p['reason'] for p in penalties)

    def test_apply_penalties_ai(self, scorer):
        """Tests deduction for AI-generated code."""
        results = {'ai_detection': {'verdict': 'LIKELY_AI'}}
        new_score, penalties = scorer._apply_penalties(100.0, results)
        assert new_score == 85.0
        assert any("AI-generated" in p['reason'] for p in penalties)

    def test_apply_bonuses_max_cap(self, scorer):
        """Ensures bonuses are capped at +5.0 even if multiple categories are perfect."""
        results = {
            'code_quality': {'final_score': 100.0}, # +3
            'alignment': {'overall_alignment_score': 100.0}, # +2
            'plagiarism': {'originality_score': 100.0}, # +2
            'doc_evaluation': {'final_score': 100.0} # +2
        }
        # Total potential = 3+2+2+2 = 9
        new_score, bonuses = scorer._apply_bonuses(80.0, results)
        assert new_score == 85.0 # Max cap 5
        assert any("cap" in b['reason'].lower() for b in bonuses)

    def test_calculate_overall_score_perfect(self, scorer, perfect_results):
        """Tests the full scoring flow for a perfect project."""
        summary = scorer.calculate_overall_score(perfect_results)
        assert summary['final_score'] == 100.0  # (Base 100 + Bonus 5, capped at 100)
        assert summary['letter_grade'] == 'A+'
        assert summary['component_scores']['originality'] == 100.0

    def test_calculate_overall_score_failing(self, scorer, failing_results):
        """Tests the full scoring flow for a poor quality project with academic integrity issues."""
        summary = scorer.calculate_overall_score(failing_results)
        assert summary['final_score'] < 30.0
        assert summary['letter_grade'] == 'F'
        assert len(summary['penalties']) >= 3

# --- Integration Tests: EnhancedProjectEvaluator ---

class TestEnhancedProjectEvaluator:
    """Mock-based integration tests for the full pipeline orchestrator."""

    @patch("app.ai_engine.comprehensive_scorer.EnhancedProjectEvaluator.__init__", return_value=None)
    def test_evaluate_project_flow(self, mock_init):
        """Validates that evaluate_project calls all sub-engines and compiles results."""
        evaluator = EnhancedProjectEvaluator()
        
        # Manually mock the components since we skipped __init__
        evaluator.code_analyzer = MagicMock()
        evaluator.doc_evaluator = MagicMock()
        evaluator.ai_detector = MagicMock()
        evaluator.aligner = MagicMock()
        evaluator.plagiarism_detector = MagicMock()
        evaluator.scorer = ComprehensiveScorer() # Use real scorer for math
        evaluator.feedback_generator = MagicMock()

        # Setup sub-engine returns
        evaluator.code_analyzer.analyze.return_value = {'final_score': 80.0}
        evaluator.doc_evaluator.evaluate.return_value = {'final_score': 90.0}
        evaluator.ai_detector.analyze.return_value = {'ai_generated_probability': 0.1, 'verdict': 'HUMAN'}
        evaluator.aligner.analyze_alignment.return_value = {'overall_alignment_score': 85.0}
        evaluator.plagiarism_detector.detect.return_value = {'originality_score': 100.0}
        evaluator.feedback_generator.generate_comprehensive_feedback.return_value = {"text": "Good job"}

        project_data = {
            'id': 1,
            'code_file_path': 'fake.py',
            'doc_file_path': 'fake.pdf',
            'existing_projects': []
        }

        # Mock the open() for code reading
        with patch("builtins.open", mock_open(read_data="print('hello')")):
            final_results = evaluator.evaluate_project(project_data)

        assert 'scoring' in final_results
        assert final_results['scoring']['final_score'] > 0
        assert final_results['code_quality']['final_score'] == 80.0
        assert final_results['feedback']['text'] == "Good job"

# --- Edge Case and Error Scenario Tests ---

class TestScorerEdgeCases:
    """Tests for boundary conditions and invalid inputs."""

    def test_zero_scores(self, scorer):
        """Tests behavior when all input scores are zero."""
        empty_results = {
            'code_quality': {'final_score': 0.0},
            'doc_evaluation': {'final_score': 0.0},
            'alignment': {'overall_alignment_score': 0.0},
            'plagiarism': {'originality_score': 0.0},
            'ai_detection': {'ai_generated_probability': 1.0},
            'functionality': {'score': 0.0}
        }
        summary = scorer.calculate_overall_score(empty_results)
        assert summary['final_score'] == 0.0
        assert summary['letter_grade'] == 'F'

    def test_invalid_input_types(self, scorer):
        """Ensures the scorer handles missing keys by using defaults (0.0)."""
        summary = scorer.calculate_overall_score({}) # Completely empty dict
        assert 'final_score' in summary
        assert summary['final_score'] >= 0.0

    def test_score_clamping(self, scorer):
        """Ensures final score never exceeds 100 or drops below 0."""
        # Force a scenario where base + bonus > 100
        perfect = MockEvaluationData.get_perfect_results()
        summary = scorer.calculate_overall_score(perfect)
        assert summary['final_score'] == 100.0

        # Force a scenario where base - penalties < 0
        failing = MockEvaluationData.get_failing_results()
        summary = scorer.calculate_overall_score(failing)
        assert summary['final_score'] >= 0.0
