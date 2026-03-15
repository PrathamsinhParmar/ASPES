import pytest
from unittest.mock import MagicMock, patch
from app.ai_engine.code_analyzer import CodeAnalyzer
from app.ai_engine.comprehensive_scorer import ComprehensiveScorer
from app.ai_engine.ai_code_detector import AICodeDetector

def test_code_analyzer_basic():
    analyzer = CodeAnalyzer()
    # Test with a mock file path or a small sample
    with patch('builtins.open', MagicMock(return_value=MagicMock(read=lambda: "def hello():\n    print('world')"))):
        with patch('pathlib.Path.exists', return_value=True):
            with patch('pathlib.Path.suffix', '.py'):
                # Mock radon calls since they might fail in test env without full setup
                with patch('radon.complexity.cc_visit', return_value=[]):
                    with patch('radon.metrics.mi_visit', return_value=100.0):
                        results = analyzer.analyze("fake_path.py")
                        assert 'final_score' in results
                        assert results['final_score'] > 0

def test_comprehensive_scorer():
    scorer = ComprehensiveScorer()
    mock_results = {
        'code_quality': {'final_score': 85.0},
        'doc_evaluation': {'final_score': 90.0},
        'alignment': {'overall_alignment_score': 88.0},
        'plagiarism': {'originality_score': 95.0},
        'ai_detection': {'ai_generated_probability': 0.1},
        'functionality': {'score': 100.0}
    }
    score_breakdown = scorer.calculate_overall_score(mock_results)
    assert score_breakdown['final_score'] > 80
    assert score_breakdown['letter_grade'] in ['A', 'A-', 'B+']

def test_ai_detector_heuristics():
    detector = AICodeDetector()
    # Very human-like code (messy, no comments)
    human_code = "x=1\ny=2\ndef f(a):return a+x+y"
    results = detector.analyze(human_code)
    assert results['ai_generated_probability'] < 0.5
    
    # Very AI-like code (perfect formatting, docstrings, verbose names)
    ai_code = '''
def calculate_system_equilibrium_state(initial_vector_state):
    """
    Calculates the equilibrium state of the system based on initial parameters.
    """
    system_result = initial_vector_state * 1.05
    return system_result
'''
    results_ai = detector.analyze(ai_code)
    assert results_ai['ai_generated_probability'] > results['ai_generated_probability']
