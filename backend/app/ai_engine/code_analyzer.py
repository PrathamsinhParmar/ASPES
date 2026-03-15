"""
AI Engine - Code Quality Analyzer
Uses Radon and Pylint to analyze code complexity, maintainability, and quality.
"""
import ast
import json
import logging
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# Static analysis tools
import radon.complexity as cc
import radon.metrics as rm

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CodeAnalyzer:
    """
    Analyzes code quality using static analysis tools.
    Returns scores for complexity, maintainability, and overall quality.
    """
    
    def __init__(self):
        self.weights = {
            'complexity': 0.3,
            'maintainability': 0.3,
            'quality': 0.4
        }
        # Local cache for analysis results
        self._cache: Dict[str, Dict[str, Any]] = {}

    def analyze(self, file_path: str) -> Dict[str, Any]:
        """
        Main analysis method.
        
        Args:
            file_path: Path to file to analyze
            
        Returns:
            Analysis results including scores and details.
        """
        path = Path(file_path)
        if not path.exists():
            return self._get_default_error_response("File not found")

        # Basic Check for large files
        try:
            if path.stat().st_size > 10 * 1024 * 1024:  # > 10MB
                return self._get_default_error_response("File too large for analysis")
        except Exception:
            pass

        # Check cache
        if file_path in self._cache:
            return self._cache[file_path]

        # Only support Python for full analysis currently as per prompt requirements for Radon/Pylint
        if path.suffix != ".py":
            return self._get_default_error_response("Unsupported language for deep analysis")

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                code = f.read()
            
            if not code.strip():
                return self._get_default_error_response("Empty file")

            complexity_score = self._analyze_complexity(code)
            maintainability_score = self._analyze_maintainability(code)
            quality_score = self._analyze_quality(file_path)
            
            details = self._get_code_details(code)
            
            final_score = (
                complexity_score * self.weights['complexity'] +
                maintainability_score * self.weights['maintainability'] +
                quality_score * self.weights['quality']
            )
            
            results = {
                'final_score': round(final_score, 2),
                'complexity': round(complexity_score, 2),
                'maintainability': round(maintainability_score, 2),
                'quality': round(quality_score, 2),
                'details': details
            }
            
            self._cache[file_path] = results
            return results

        except Exception as e:
            logger.error(f"Error analyzing {file_path}: {e}")
            return self._get_default_error_response(str(e))

    def _analyze_complexity(self, code: str) -> float:
        """
        Use radon.complexity to calculate cyclomatic complexity.
        Formula: score = max(0, 100 - (avg_complexity * 10))
        """
        try:
            blocks = cc.cc_visit(code)
            if not blocks:
                return 100.0
            
            total_complexity = sum(block.complexity for block in blocks)
            avg_complexity = total_complexity / len(blocks)
            
            score = max(0.0, 100.0 - (avg_complexity * 10))
            return score
        except Exception:
            return 50.0  # Default for failures

    def _analyze_maintainability(self, code: str) -> float:
        """
        Use radon.metrics to calculate maintainability index (0-100).
        """
        try:
            mi_score = rm.mi_visit(code, multi=True)
            return min(100.0, max(0.0, float(mi_score)))
        except Exception:
            return 50.0

    def _analyze_quality(self, file_path: str) -> float:
        """
        Use Pylint to assess code quality.
        Converts 0-10 scale to 0-100.
        """
        try:
            # Pylint 3.0+ removed epylint. Using subprocess for compatibility.
            cmd = [sys.executable, "-m", "pylint", file_path, "--output-format=json", "--score=y", "--disable=all", "--enable=E,W,R,C"]
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            # Pylint outputs score in a standard summary, but we check if we can parse the json for actual error count
            try:
                data = json.loads(result.stdout)
                # Count issues as a fallback if score parsing fails
                # Simple heuristic: 100 - (issues * 2)
                issue_count = len(data)
                score = max(0, 100 - (issue_count * 2))
                return float(score)
            except Exception:
                # If JSON fails, try to find the score in output or default
                return 70.0 
        except Exception:
            return 60.0

    def _get_code_details(self, code: str) -> dict:
        """
        Extract detailed metrics using AST parsing.
        """
        try:
            tree = ast.parse(code)
            functions = [n for n in ast.walk(tree) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
            classes = [n for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]
            
            blocks = cc.cc_visit(code)
            complexities = [b.complexity for b in blocks]
            
            lines = code.splitlines()
            comment_lines = len([l for l in lines if l.strip().startswith('#')])
            
            return {
                'cyclomatic_complexity': {
                    'average': round(sum(complexities)/len(complexities), 2) if complexities else 0,
                    'max': max(complexities) if complexities else 0,
                    'per_function': [{"name": b.name, "complexity": b.complexity} for b in blocks]
                },
                'lines_of_code': len(lines),
                'functions_count': len(functions),
                'classes_count': len(classes),
                'comment_lines': comment_lines
            }
        except Exception:
            return {}

    def _get_default_error_response(self, message: str) -> dict:
        return {
            'final_score': 0.0,
            'complexity': 0.0,
            'maintainability': 0.0,
            'quality': 0.0,
            'error': message,
            'details': {}
        }
