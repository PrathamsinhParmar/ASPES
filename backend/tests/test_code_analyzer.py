import pytest
import os
import json
import subprocess
import textwrap
from pathlib import Path
from unittest.mock import patch, MagicMock

from app.ai_engine.code_analyzer import CodeAnalyzer

# --- Fixtures ---

@pytest.fixture
def analyzer():
    """Returns a fresh instance of CodeAnalyzer."""
    return CodeAnalyzer()

@pytest.fixture
def temp_python_file(tmp_path):
    """Creates a temporary python file with simple code."""
    d = tmp_path / "test_dir"
    d.mkdir()
    f = d / "test_code.py"
    code = textwrap.dedent("""
        def calculate_sum(a, b):
            # A simple sum function
            return a + b
            
        class MathOperations:
            def multiply(self, a, b):
                \"\"\"Multiplies two numbers.\"\"\"
                return a * b
    """)
    f.write_text(code)
    return str(f)

@pytest.fixture
def complex_code_sample():
    """A highly complex code sample to test complexity analysis."""
    return textwrap.dedent("""
        def over_complicated_function(x):
            if x > 10:
                for i in range(x):
                    if i % 2 == 0:
                        print(i)
                    else:
                        for j in range(i):
                            if j == 5:
                                break
            elif x < 0:
                return -1
            else:
                return 0
    """)

# --- Unit Tests ---

def test_file_not_found(analyzer):
    """Test handling of non-existent files."""
    result = analyzer.analyze("non_existent_file.py")
    assert result["final_score"] == 0.0
    assert "File not found" in result["error"]

def test_unsupported_language(analyzer, tmp_path):
    """Test handling of unsupported file types."""
    f = tmp_path / "test.txt"
    f.write_text("Some text")
    result = analyzer.analyze(str(f))
    assert result["final_score"] == 0.0
    assert "Unsupported language" in result["error"]

def test_empty_file(analyzer, tmp_path):
    """Test handling of empty files."""
    f = tmp_path / "empty.py"
    f.write_text("   ")
    result = analyzer.analyze(str(f))
    assert result["final_score"] == 0.0
    assert "Empty file" in result["error"]

def test_large_file(analyzer, tmp_path):
    """Test handling of files that exceed the size limit."""
    f = tmp_path / "large.py"
    # Create a >10MB file
    with open(f, "wb") as out:
        out.seek(11 * 1024 * 1024 - 1)
        out.write(b"\0")
    
    result = analyzer.analyze(str(f))
    assert result["final_score"] == 0.0
    assert "File too large" in result["error"]

def test_analyze_complexity(analyzer, complex_code_sample):
    """Test cyclomatic complexity score calculation."""
    score = analyzer._analyze_complexity(complex_code_sample)
    # Complex code should have a lower score than simple code
    simple_code = "def simple(): return 1"
    simple_score = analyzer._analyze_complexity(simple_code)
    
    assert simple_score > score
    assert 0 <= score <= 100

def test_analyze_maintainability(analyzer):
    """Test Maintainability Index calculation."""
    code = "def hello(): print('world')"
    score = analyzer._analyze_maintainability(code)
    assert 0 <= score <= 100

@patch("subprocess.run")
def test_analyze_quality_pylint(mock_run, analyzer, temp_python_file):
    """Test Pylint quality scoring with mocked subprocess output."""
    # Mock successful pylint run with 2 issues
    mock_response = MagicMock()
    mock_response.stdout = json.dumps([{"type": "error"}, {"type": "warning"}])
    mock_run.return_value = mock_response
    
    score = analyzer._analyze_quality(temp_python_file)
    # (100 - (2 * 2)) = 96
    assert score == 96.0

@patch("subprocess.run")
def test_analyze_quality_fallback(mock_run, analyzer, temp_python_file):
    """Test fallback quality score when pylint fails or output is unparseable."""
    mock_run.side_effect = Exception("Pylint error")
    score = analyzer._analyze_quality(temp_python_file)
    assert score == 60.0 # Default failure score

def test_get_code_details(analyzer, temp_python_file):
    """Test extraction of code details (LOC, functions, classes, comments)."""
    with open(temp_python_file, 'r') as f:
        code = f.read()
    
    details = analyzer._get_code_details(code)
    assert details["lines_of_code"] > 0
    assert details["functions_count"] == 2 # calculate_sum and multiply
    assert details["classes_count"] == 1   # MathOperations
    assert details["comment_lines"] == 1   # # A simple sum function

# --- Integration Tests ---

@patch("app.ai_engine.code_analyzer.CodeAnalyzer._analyze_quality")
def test_full_analysis_integration(mock_quality, analyzer, temp_python_file):
    """Integration test for the full analysis pipeline."""
    mock_quality.return_value = 100.0 # Force high quality score
    
    result = analyzer.analyze(temp_python_file)
    
    assert "final_score" in result
    assert result["final_score"] > 0
    assert "details" in result
    assert result["details"]["functions_count"] == 2
    
    # Verify caching
    cached_result = analyzer.analyze(temp_python_file)
    assert cached_result is result # Should be the same object from cache

def test_analyze_invalid_syntax(analyzer, tmp_path):
    """Test processing a file with Python syntax errors."""
    f = tmp_path / "broken.py"
    f.write_text("def broken(:") # syntax error
    
    result = analyzer.analyze(str(f))
    # It shouldn't crash, but might return default scores for some components
    assert "final_score" in result
    assert result["final_score"] > 0 # Some metrics might still work or return defaults
