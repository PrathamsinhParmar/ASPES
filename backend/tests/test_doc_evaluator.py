import pytest
import os
import textwrap
from pathlib import Path
from unittest.mock import patch, MagicMock, mock_open

from app.ai_engine.doc_evaluator import DocumentationEvaluator

# --- Fixtures ---

@pytest.fixture
def evaluator():
    """Returns a fresh instance of DocumentationEvaluator."""
    return DocumentationEvaluator()

@pytest.fixture
def complete_doc_content():
    """A comprehensive document content including all required sections and optimal sentence lengths."""
    return textwrap.dedent("""
        # Project Introduction
        This introduction section provides a comprehensive background of the project objectives and goals for all users.
        
        ## Overview
        The system provides a comprehensive evaluation of academic projects by using advanced machine learning and static analysis techniques.
        
        ## Installation
        You can install the necessary dependencies by running the standard npm install and pip install requirements commands successfully.
        
        ## Usage
        Users can start the development server by executing the npm start command in the root directory of the project.
        
        ## Features
        * AI code detection for identifying generated components
        * Plagiarism checking for maintaining academic integrity
        * Static analysis for code quality metrics
        
        ## Requirements
        - Python version 3.9 or higher is strictly required
        - Node.js version 16 or higher is recommended
        
        ## Examples
        ```python
        def hello():
            print("This is a sample function demonstrating code execution.")
        ```
    """)

@pytest.fixture
def minimal_doc_content():
    """A minimal document with very few sections."""
    return textwrap.dedent("""
        Project Title
        
        Introduction:
        This is a small project.
    """)

# --- Unit Tests ---

def test_empty_response(evaluator):
    """Test the empty response structure."""
    res = evaluator._empty_response("Test reason")
    assert res["final_score"] == 0.0
    assert "Test reason" in res["error"]
    assert len(res["missing_sections"]) == len(evaluator.REQUIRED_SECTIONS)

def test_check_completeness(evaluator, complete_doc_content, minimal_doc_content):
    """Test completeness scoring based on required sections."""
    # Complete doc
    score_full = evaluator._check_completeness(complete_doc_content)
    assert score_full == 100.0
    
    # Partial doc
    score_min = evaluator._check_completeness(minimal_doc_content)
    # Only "introduction" found
    assert 0 < score_min < 100
    assert evaluator._find_missing_sections(minimal_doc_content)

def test_assess_clarity(evaluator):
    """Test clarity scoring based on sentence length."""
    # Good clarity (~15-20 words per sentence)
    good_text = "This is a sentence containing exactly fifteen words to test the clarity scoring system today correctly."
    assert evaluator._assess_clarity(good_text) == 100.0
    
    # Very short sentences
    short_text = "Hi. Hello. Yes. No."
    assert evaluator._assess_clarity(short_text) == 60.0
    
    # Too long/dense sentences
    long_text = "This is an extremely long sentence that purposefully goes on for a very long time to ensure that the average word count per sentence exceeds the threshold set for being considered too dense or difficult to read for a standard audience in an academic evaluation context."
    assert evaluator._assess_clarity(long_text) <= 70.0

def test_evaluate_structure(evaluator, complete_doc_content):
    """Test structure evaluation for headings, code, and lists."""
    score = evaluator._evaluate_structure(complete_doc_content)
    assert score == 100.0 # Has headings, code, and lists
    
    simple_text = "Just some plain text without any formatting."
    assert evaluator._evaluate_structure(simple_text) == 0.0

def test_calculate_readability_grade(evaluator):
    """Test readability grade estimation."""
    simple = "The cat sat on the mat. It was a fat cat."
    assert evaluator._calculate_readability_grade(simple) == "High School"
    
    complex_text = "The manifestation of abstract complexities in computational linguistics necessitates a multi-layered architectural approach to achieve optimal efficiency."
    grade = evaluator._calculate_readability_grade(complex_text)
    assert grade in ["Graduate", "Expert / Technical"]

# --- Mocking Extraction Tests ---

@patch("builtins.open", new_callable=mock_open, read_data="Sample text content")
def test_extract_plain(mock_file, evaluator):
    """Test plain text extraction."""
    content = evaluator._extract_plain("test.txt")
    assert content == "Sample text content"

@patch("app.ai_engine.doc_evaluator.DocumentationEvaluator._extract_pdf")
def test_extract_text_routing(mock_pdf, evaluator):
    """Test that text extraction routes to the correct parser."""
    evaluator._extract_text("test.pdf")
    mock_pdf.assert_called_once_with("test.pdf")

def test_extract_pdf_pdfplumber(evaluator):
    """Test PDF extraction using pdfplumber mock."""
    import sys
    mock_pdfplumber = MagicMock()
    mock_pdf = MagicMock()
    mock_page = MagicMock()
    mock_page.extract_text.return_value = "PDF Content"
    mock_pdf.pages = [mock_page]
    mock_pdfplumber.open.return_value.__enter__.return_value = mock_pdf
    
    with patch.dict(sys.modules, {'pdfplumber': mock_pdfplumber}):
        content = evaluator._extract_pdf("test.pdf")
        assert "PDF Content" in content

def test_extract_docx(evaluator):
    """Test DOCX extraction using python-docx mock."""
    import sys
    mock_docx = MagicMock()
    mock_doc = MagicMock()
    mock_para = MagicMock()
    mock_para.text = "Docx content"
    mock_doc.paragraphs = [mock_para]
    mock_docx.Document.return_value = mock_doc
    
    with patch.dict(sys.modules, {'docx': mock_docx}):
        content = evaluator._extract_docx("test.docx")
        assert content == "Docx content"

# --- Integration Test ---

@patch("app.ai_engine.doc_evaluator.DocumentationEvaluator._extract_text")
def test_full_evaluate_integration(mock_extract, evaluator, complete_doc_content):
    """Test the full evaluate pipeline integration."""
    mock_extract.return_value = complete_doc_content
    
    result = evaluator.evaluate("mock_path.md")
    
    assert result["final_score"] == 100.0
    assert result["completeness"] == 100.0
    assert result["word_count"] > 0
    assert not result["missing_sections"]
    assert result["code_examples_count"] == 1

def test_evaluate_invalid_path(evaluator):
    """Test evaluate with invalid or empty file path."""
    result = evaluator.evaluate("")
    assert result["final_score"] == 0.0
    assert "No file path" in result["error"]
