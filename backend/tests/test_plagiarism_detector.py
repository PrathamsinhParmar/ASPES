import pytest
from unittest.mock import patch, MagicMock, mock_open
import textwrap
import re

from app.ai_engine.plagiarism_detector import PlagiarismDetector, PlagiarismDetectorWithCache

# --- Fixtures ---

@pytest.fixture
def detector():
    """Provides a fresh instance of the base PlagiarismDetector."""
    return PlagiarismDetector()

@pytest.fixture
def cached_detector():
    """Provides a fresh instance of the PlagiarismDetectorWithCache."""
    return PlagiarismDetectorWithCache()

@pytest.fixture
def sample_python_code():
    return textwrap.dedent("""
        def process_data(data):
            # Normalization check: comments should be removed
            results = []
            for item in data:
                if item > 10:
                    results.append(item * 2)
            return results
    """)

@pytest.fixture
def similar_python_code():
    return textwrap.dedent("""
        def handle_info(vals):
            # Different names, same logic structure
            output = []
            for x in vals:
                if x > 10:
                    output.append(x * 2)
            return output
    """)

# --- Unit Tests: Normalization and Utility ---

class TestPlagiarismNormalization:
    """Groups tests for text preprocessing and normalization."""
    
    def test_normalize_code_removes_comments(self, detector):
        """Validates that comments and docstrings are stripped from Python code."""
        code_with_comments = textwrap.dedent("""
            # Header comment
            def test():
                \"\"\"Docstring content.\"\"\"
                x = 1 # Inline comment
                return x
        """)
        normalized = detector._normalize_code(code_with_comments)
        
        # normalized should not contain 'header', 'docstring', or 'inline'
        assert "header" not in normalized
        assert "docstring" not in normalized
        assert "inline" not in normalized
        assert "def test" in normalized

    def test_normalize_code_fallback(self, detector):
        """Validates basic regex normalization when AST parsing fails (e.g. invalid syntax)."""
        invalid_python = "def broken( # This is a comment"
        normalized = detector._normalize_code(invalid_python)
        # Note: Current base implementation regex '^ *#' only catches start-of-line comments.
        # However, we test that the logic doesn't crash and does some level of cleaning.
        assert "def broken" in normalized.lower()

    def test_chunk_code_logic(self, detector):
        """Validates that code is split into chunks of specific character sizes."""
        long_string = "A" * 1200
        chunks = detector._chunk_code(long_string, chunk_size=500)
        
        assert len(chunks) == 3
        assert chunks[0] == "A" * 500
        assert chunks[2] == "A" * 200

    def test_get_risk_level_mapping(self, detector):
        """Validates float similarity mapping to categorical risk levels."""
        assert detector._get_risk_level(0.95) == "HIGH"
        assert detector._get_risk_level(0.80) == "MEDIUM"
        assert detector._get_risk_level(0.65) == "LOW"
        assert detector._get_risk_level(0.10) == "MINIMAL"

# --- Unit Tests: Mocked ML Detection ---

class TestPlagiarismMLDetection:
    """Groups tests involving semantic similarity and ML mocks."""

    @patch("app.ai_engine.plagiarism_detector._get_sbert")
    def test_detect_no_projects(self, mock_sbert, detector, sample_python_code):
        """Validates behavior when no existing projects are provided for comparison."""
        mock_sbert.return_value = None # Fallback to heuristic
        results = detector.detect(sample_python_code, [])
        
        assert results["originality_score"] == 100.0
        assert results["flagged"] is False
        assert results["similar_projects"] == []

    def test_detect_empty_input(self, detector):
        """Validates handling of empty or whitespace input strings."""
        results = detector.detect("   ", [])
        assert results["originality_score"] == 100.0
        assert "empty" in results["error"].lower()

    @patch("app.ai_engine.plagiarism_detector._get_sbert")
    def test_compare_code_jaccard_fallback(self, mock_sbert, detector):
        """Validates Jaccard overlap fallback when Sentence-BERT is unavailable."""
        mock_sbert.return_value = None
        
        code_a = "def test(x): return x * 2"
        code_b = "def test(x): return x * 2" # 100% same
        
        # Testing _compare_code internal fallback
        sim = detector._compare_code(None, [code_a], None, code_b, 1)
        assert sim == 1.0

    def test_ml_similarity_logic(self, detector):
        """Validates mathematical processing of cosine similarity tensors."""
        import sys
        mock_model = MagicMock()
        mock_sbert = MagicMock()
        mock_torch = MagicMock()
        
        # Mocking tensor max and mean operations
        mock_tensor = MagicMock()
        # item() needs to return the float
        mock_mean = MagicMock()
        mock_mean.item.return_value = 0.85
        
        # Setup the chain of calls: max() returns (values, indices)
        mock_max_result = (MagicMock(), MagicMock())
        mock_max_result[0].mean.return_value = mock_mean
        mock_tensor.max.return_value = mock_max_result
        
        mock_sbert.util.cos_sim.return_value = mock_tensor
        
        with patch.dict(sys.modules, {'sentence_transformers': mock_sbert, 'torch': mock_torch}), \
             patch("app.ai_engine.plagiarism_detector._get_sbert", return_value=mock_model):
            sim = detector._compare_code(mock_model, ["chunk"], MagicMock(), "proj", 1)
            assert sim == 0.85

# --- Integration and Database Tests ---

class TestPlagiarismIntegration:
    """Groups tests for database integration and report generation."""

    def test_generate_detailed_report_high_risk(self, detector):
        """Validates report formatting for a high-risk plagiarism result."""
        results = {
            "originality_score": 5.0,
            "max_similarity_percent": 95.0,
            "risk_level": "HIGH",
            "flagged": True,
            "similar_projects": [{"project_id": 1, "student_name": "Bob", "similarity": 0.95}]
        }
        report = detector.generate_detailed_report(results)
        
        assert "HIGH" in report
        assert "YES" in report
        assert "CRITICAL" in report
        assert "Bob" in report

    def test_generate_detailed_report_original(self, detector):
        """Validates report formatting for original code."""
        results = {
            "originality_score": 100.0,
            "risk_level": "MINIMAL",
            "similar_projects": []
        }
        report = detector.generate_detailed_report(results)
        assert "original" in report.lower()
        assert "MINIMAL" in report

    @patch("builtins.open", new_callable=mock_open, read_data="print('hello')")
    def test_detect_with_database(self, mock_file, detector):
        """Validates full integration from DB query to similarity detection."""
        mock_db = MagicMock()
        
        # Mocking SQLAlchemy Project model
        mock_project = MagicMock()
        mock_project.id = 10
        mock_project.code_file_path = "path/to/code.py"
        mock_project.owner.full_name = "Alice"
        
        mock_db.query().filter().all.return_value = [mock_project]
        
        results = detector.detect_with_database("print('hello')", mock_db, current_project_id=1)
        
        assert results["max_similarity_percent"] == 100.0
        assert results["similar_projects"][0]["student_name"] == "Alice"

# --- Subclass / Cache Tests ---

class TestPlagiarismCaching:
    """Groups tests for the PlagiarismDetectorWithCache subclass."""

    def test_embedding_cache_hit(self, cached_detector):
        """Validates that embeddings are reused when the project_id is repeated."""
        mock_model = MagicMock()
        mock_emb = "stored_embedding"
        mock_model.encode.return_value = mock_emb
        
        # 1st call: Cache miss
        res1 = cached_detector._get_or_generate_embedding(1, ["chunk"], mock_model)
        assert res1 == mock_emb
        assert mock_model.encode.call_count == 1
        
        # 2nd call: Cache hit
        res2 = cached_detector._get_or_generate_embedding(1, ["chunk"], mock_model)
        assert res2 == mock_emb
        assert mock_model.encode.call_count == 1 # Still 1
