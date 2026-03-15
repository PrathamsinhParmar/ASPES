import pytest
import os
import textwrap
import json
import ast
import re
from unittest.mock import patch, MagicMock, mock_open
from app.ai_engine.report_code_aligner import ReportCodeAligner

# --- Mock Data Generation ---

class MockDataFactory:
    @staticmethod
    def get_valid_report():
        return textwrap.dedent("""
            # Project Overview
            This project is a FastAPI application that uses SQLAlchemy for the database layer.
            The main features include user_authentication, data_validation, and file_upload.
            We use a Model-View-Controller architecture.
            The algorithm implements a binary search for optimization.
        """)

    @staticmethod
    def get_valid_code():
        return textwrap.dedent("""
            import fastapi
            from sqlalchemy import Column, Integer
            
            class UserModel:
                \"\"\"Represents a user in the database.\"\"\"
                pass

            def user_authentication(username, password):
                \"\"\"Authenticates a user based on credentials.\"\"\"
                return True

            def data_validation(data):
                # Validates input data structure
                return True

            def _internal_helper():
                return None
        """)

    @staticmethod
    def get_json_report():
        data = {
            "title": "Data Processor",
            "description": "Uses pandas and numpy for data processing.",
            "components": ["csv_reader", "data_cleaner"],
            "architecture": "REST API"
        }
        return json.dumps(data)

    @staticmethod
    def get_xml_report():
        return """
        <report>
            <title>Neural Network Project</title>
            <content>Implementing a neural network using pytorch. Features include model_training and inference.</content>
        </report>
        """

# --- Test Fixtures ---

@pytest.fixture
def aligner():
    return ReportCodeAligner()

# --- Test Classes ---

class TestReportCodeAlignerExtraction:
    """Tests for feature extraction from reports and code."""

    def test_extract_report_features_basic(self, aligner):
        report = MockDataFactory.get_valid_report()
        features = aligner._extract_report_features(report)
        
        assert "fastapi" in features["mentioned_technologies"]
        assert "sqlalchemy" in features["mentioned_technologies"]
        assert any("authentication" in f.lower() for f in features["mentioned_functions"])
        assert "binary search" in features["mentioned_algorithms"]

    def test_extract_code_features_python(self, aligner):
        code = MockDataFactory.get_valid_code()
        features = aligner._extract_code_features(code)
        
        assert any(f["name"] == "user_authentication" for f in features["functions"])
        assert any(c["name"] == "UserModel" for c in features["classes"])
        assert "fastapi" in features["technologies"]
        assert "sqlalchemy" in features["imports"]

    def test_extract_code_features_fallback(self, aligner):
        # Invalid python code (syntax error) but valid for the fallback regex: r"def (\w+)\s*\("
        code = "def non_python_function() { print 'hello' }"
        features = aligner._extract_code_features(code)
        
        assert any(f["name"] == "non_python_function" for f in features["functions"])

class TestReportCodeAlignerLogic:
    """Tests for alignment logic and sub-scores."""

    def test_check_feature_alignment(self, aligner):
        report_features = {"mentioned_functions": ["user_authentication", "missing_func"]}
        code_features = {"functions": [{"name": "user_authentication"}]}
        
        result = aligner._check_feature_alignment(report_features, code_features)
        assert result["score"] == 0.5
        assert "user_authentication" in result["matched_features"]
        assert "missing_func" in result["unmatched_features"]

    def test_check_technology_stack(self, aligner):
        report = "Uses redis and celery."
        code = "import redis"
        
        result = aligner._check_technology_stack(report, code)
        assert "redis" in result["verified_technologies"]
        assert "celery" in result["unverified_technologies"]
        assert result["score"] == 0.5

    def test_check_architecture_match(self, aligner):
        report = "This is a REST API with a database."
        code_features = {
            "functions": [{"name": "get_user_endpoint"}],
            "classes": [{"name": "UserDB"}]
        }
        result = aligner._check_architecture_match(report, code_features)
        assert result["score"] > 0.5
        assert any("API" in f for f in result["findings"])

class TestReportCodeAlignerSemantic:
    """Tests for semantic similarity with SBERT mocking."""

    @patch("app.ai_engine.report_code_aligner._get_sbert")
    def test_calculate_semantic_similarity_mocked(self, mock_get_sbert, aligner):
        mock_model = MagicMock()
        mock_get_sbert.return_value = mock_model
        
        # Mock numpy dot product for cosine similarity
        import numpy as np
        with patch("numpy.dot", return_value=0.9), \
             patch("numpy.linalg.norm", return_value=1.0):
            
            result = aligner._calculate_semantic_similarity("Report", "print('hello')")
            assert result["similarity_percentage"] == 90.0
            assert "Excellent" in result["interpretation"]

    def test_keyword_overlap_fallback(self, aligner):
        # Without SBERT, should use Jaccard
        # _keyword_overlap uses regex r"\b[a-z]{4,}\b"
        text_a = "Technical report documenting system architecture"
        text_b = "Technical report documenting source structures"
        score = aligner._keyword_overlap(text_a, text_b)
        assert 0 < score < 1.0

class TestReportCodeAlignerIntegration:
    """End-to-end integration tests for the analyze_alignment method."""

    @patch("app.ai_engine.report_code_aligner._get_sbert", return_value=None)
    @patch("app.ai_engine.report_code_aligner._get_spacy", return_value=None)
    def test_analyze_alignment_full(self, mock_spacy, mock_sbert, aligner):
        report = MockDataFactory.get_valid_report()
        code = MockDataFactory.get_valid_code()
        
        result = aligner.analyze_alignment(report, code)
        
        assert "overall_alignment_score" in result
        assert result["overall_alignment_score"] > 0
        assert "detailed_results" in result
        assert "mismatches" in result

    def test_analyze_alignment_empty_input(self, aligner):
        result = aligner.analyze_alignment("", "")
        assert result["overall_alignment_score"] == 0.0
        assert "missing" in result["error"].lower()

class TestReportCodeAlignerEdgeCases:
    """Tests for edge cases and malformed data."""

    def test_large_dataset_performance(self, aligner):
        # Stress test with large code and report
        large_report = "Feature " * 1000
        large_code = "def func_() : pass\n" * 1000
        
        # Should complete in reasonable time without crashing
        result = aligner.analyze_alignment(large_report, large_code)
        assert "overall_alignment_score" in result

    def test_various_formats_processing(self, aligner):
        # JSON Report
        json_report = MockDataFactory.get_json_report()
        code = "import pandas\ndef csv_reader(): pass"
        result = aligner.analyze_alignment(json_report, code)
        assert result["detailed_results"]["feature_alignment"]["score"] > 0
        
        # XML Report
        xml_report = MockDataFactory.get_xml_report()
        code = "import torch\ndef model_training(): pass"
        result = aligner.analyze_alignment(xml_report, code)
        assert result["detailed_results"]["technology_alignment"]["score"] > 0

# --- Error Handling ---

class TestReportCodeAlignerErrors:
    """Tests for error scenarios and exception handling."""

    @patch("app.ai_engine.report_code_aligner.ReportCodeAligner._extract_report_features")
    def test_analyze_alignment_exception(self, mock_extract, aligner):
        mock_extract.side_effect = Exception("System Error")
        result = aligner.analyze_alignment("Report", "Code")
        assert result["overall_alignment_score"] == 0.0
        assert "System Error" in result["error"]
