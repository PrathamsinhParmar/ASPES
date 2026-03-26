"""
AI Engine - Enhanced Code Quality Analyzer (v2)

Analysis Dimensions:
  1. Cyclomatic Complexity   (radon.complexity)
  2. Maintainability Index   (radon.metrics)
  3. Code Quality / Linting  (pylint via subprocess)
  4. Security Analysis       (AST-based vulnerability scanning)
  5. Documentation Coverage  (docstrings + comment density)
  6. Code Duplication        (heuristic duplicate-block detection)
  7. Type-Safety             (annotation coverage for functions/params)

Final score = weighted average of all 7 dimensions.
"""

import ast
import hashlib
import json
import logging
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import radon.complexity as cc
import radon.metrics as rm

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Scoring weights (must sum to 1.0)
# ---------------------------------------------------------------------------
_WEIGHTS: Dict[str, float] = {
    "complexity":     0.20,
    "maintainability": 0.15,
    "quality":         0.20,
    "security":        0.20,
    "documentation":   0.10,
    "duplication":     0.08,
    "type_safety":     0.07,
}

# ---------------------------------------------------------------------------
# Security: high-risk patterns to flag
# ---------------------------------------------------------------------------
_SECURITY_PATTERNS: List[Tuple[str, str]] = [
    # Pattern                              # Description
    (r"\beval\s*\(",                       "Use of eval() — arbitrary code execution risk"),
    (r"\bexec\s*\(",                       "Use of exec() — arbitrary code execution risk"),
    (r"\bpickle\.(load|loads|dump|dumps)\s*\(",  "Use of pickle — untrusted deserialization risk"),
    (r"\bos\.system\s*\(",                 "Use of os.system() — shell injection risk"),
    (r"\bsubprocess\.(call|run|Popen)\s*\(.*shell\s*=\s*True",
                                           "subprocess with shell=True — shell injection risk"),
    (r"password\s*=\s*['\"][^'\"]{3,}['\"]",  "Hardcoded password detected"),
    (r"secret\s*=\s*['\"][^'\"]{3,}['\"]",    "Hardcoded secret key detected"),
    (r"api_?key\s*=\s*['\"][^'\"]{3,}['\"]",  "Hardcoded API key detected"),
    (r"\bSELECT\b.*\bFROM\b.*\+",         "Possible SQL injection via string concatenation"),
    (r"\bmd5\s*\(",                        "Weak hash algorithm MD5 used"),
    (r"\bsha1\s*\(",                       "Weak hash algorithm SHA-1 used"),
    (r"\bassert\s+",                       "assert statement — disabled with -O, unreliable for security checks"),
    (r"\binput\s*\(",                      "Use of input() — potential unvalidated user input"),
    (r"random\.(random|randint|choice)\s*\(", "Non-cryptographic random — use secrets module for security-sensitive values"),
]

# ---------------------------------------------------------------------------
# Code Smell detection via AST
# ---------------------------------------------------------------------------
_SMELL_NAMES = {
    "long_function": "Functions with more than 50 lines",
    "too_many_params": "Functions with more than 5 parameters",
    "deeply_nested": "Code nested more than 4 levels deep",
    "bare_except": "Bare except: clauses",
    "global_usage": "Use of global keyword",
    "mutable_default": "Mutable default argument (list/dict/set as default)",
    "magic_numbers": "Magic numbers (unexplained numeric literals)",
}


class CodeAnalyzer:
    """
    Rigorous, multi-dimensional code quality analyzer.
    Performs 7 independent analyses and produces a weighted final score
    alongside rich per-dimension details and actionable diagnostics.
    """

    def __init__(self) -> None:
        self.weights = _WEIGHTS
        self._cache: Dict[str, Dict[str, Any]] = {}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def analyze(self, file_path: str) -> Dict[str, Any]:
        """
        Full analysis of a Python source file.

        Args:
            file_path: Absolute or relative path to the .py file.

        Returns:
            Comprehensive analysis dict with final_score, per-dimension
            scores, details, smells, security_issues, and diagnostics.
        """
        path = Path(file_path)

        if not path.exists():
            return self._error("File not found")

        try:
            size_mb = path.stat().st_size / (1024 * 1024)
            if size_mb > 5:
                return self._error(f"File too large ({size_mb:.1f} MB) — limit is 5 MB")
        except OSError:
            pass

        if path.suffix != ".py":
            return self._error(f"Unsupported file type '{path.suffix}' — only .py files supported")

        # Cache hit
        cache_key = self._cache_key(file_path, path)
        if cache_key and cache_key in self._cache:
            return self._cache[cache_key]

        try:
            code = path.read_text(encoding="utf-8", errors="ignore")
        except OSError as exc:
            return self._error(f"Cannot read file: {exc}")

        if not code.strip():
            return self._error("File is empty")

        try:
            tree = ast.parse(code)
        except SyntaxError as exc:
            return self._error(f"Syntax error at line {exc.lineno}: {exc.msg}")

        # --- Run all 7 analyses ---
        complexity_score,   complexity_detail   = self._analyze_complexity(code)
        maintainability_score, maint_detail     = self._analyze_maintainability(code)
        quality_score,      quality_detail      = self._analyze_quality(file_path)
        security_score,     security_detail     = self._analyze_security(code)
        doc_score,          doc_detail          = self._analyze_documentation(code, tree)
        dup_score,          dup_detail          = self._analyze_duplication(code)
        type_score,         type_detail         = self._analyze_type_safety(tree)

        scores = {
            "complexity":      complexity_score,
            "maintainability": maintainability_score,
            "quality":         quality_score,
            "security":        security_score,
            "documentation":   doc_score,
            "duplication":     dup_score,
            "type_safety":     type_score,
        }

        final_score = sum(
            scores[dim] * self.weights[dim] for dim in self.weights
        )
        final_score = round(max(0.0, min(100.0, final_score)), 2)

        smells = self._detect_smells(code, tree)
        grade = self._grade(final_score)

        result: Dict[str, Any] = {
            "final_score":      final_score,
            "grade":            grade,
            "scores": {k: round(v, 2) for k, v in scores.items()},
            "weights":          self.weights,
            # backwards compat aliases
            "complexity":       round(complexity_score, 2),
            "maintainability":  round(maintainability_score, 2),
            "quality":          round(quality_score, 2),
            "details": {
                "complexity":      complexity_detail,
                "maintainability": maint_detail,
                "quality":         quality_detail,
                "security":        security_detail,
                "documentation":   doc_detail,
                "duplication":     dup_detail,
                "type_safety":     type_detail,
                **self._basic_metrics(code, tree),
            },
            "code_smells":      smells,
            "security_issues":  security_detail.get("issues", []),
            "diagnostics":      self._diagnostics(scores, smells, security_detail),
        }

        if cache_key:
            self._cache[cache_key] = result
        return result

    # ------------------------------------------------------------------
    # 1. Cyclomatic Complexity
    # ------------------------------------------------------------------
    def _analyze_complexity(self, code: str) -> Tuple[float, Dict[str, Any]]:
        """
        Score = max(0, 100 - avg_complexity * 8).
        Stricter than before: avg_complexity > 12 → score 0.
        """
        try:
            blocks = cc.cc_visit(code)
            if not blocks:
                return 100.0, {"average": 0, "max": 0, "per_function": []}

            complexities = [b.complexity for b in blocks]
            avg = sum(complexities) / len(complexities)
            max_c = max(complexities)

            # Stricter: deduct 8 per unit instead of 10 (gives more resolution)
            # but cap at 0 when avg > 12 (very complex)
            if avg > 12:
                score = 0.0
            else:
                score = max(0.0, 100.0 - avg * 8.0)

            per_fn = sorted(
                [{"name": b.name, "complexity": b.complexity, "rank": b.letter} for b in blocks],
                key=lambda x: x["complexity"], reverse=True
            )
            return score, {
                "average": round(avg, 2),
                "max": max_c,
                "distribution": self._complexity_distribution(complexities),
                "per_function": per_fn[:20],   # top-20 most complex
            }
        except Exception as exc:
            logger.warning(f"Complexity analysis failed: {exc}")
            return 50.0, {"error": str(exc)}

    def _complexity_distribution(self, complexities: List[int]) -> Dict[str, int]:
        """Radon risk bands: A(1-5), B(6-10), C(11-15), D(16-20), E(21-25), F(26+)."""
        dist = {"A": 0, "B": 0, "C": 0, "D": 0, "E": 0, "F": 0}
        for c in complexities:
            if c <= 5:   dist["A"] += 1
            elif c <= 10: dist["B"] += 1
            elif c <= 15: dist["C"] += 1
            elif c <= 20: dist["D"] += 1
            elif c <= 25: dist["E"] += 1
            else:          dist["F"] += 1
        return dist

    # ------------------------------------------------------------------
    # 2. Maintainability Index
    # ------------------------------------------------------------------
    def _analyze_maintainability(self, code: str) -> Tuple[float, Dict[str, Any]]:
        """
        Radon MI ranges 0-100. Below 20 → unreadable.
        We apply a steep penalty below 40.
        """
        try:
            mi = float(rm.mi_visit(code, multi=True))
            mi = max(0.0, min(100.0, mi))

            # Penalty ramp below 40
            if mi < 20:
                score = mi * 0.5
            elif mi < 40:
                score = mi * 0.75
            else:
                score = mi

            return round(score, 2), {
                "mi_raw": round(mi, 2),
                "interpretation": self._mi_label(mi),
            }
        except Exception as exc:
            return 50.0, {"error": str(exc)}

    def _mi_label(self, mi: float) -> str:
        if mi >= 85: return "Highly maintainable"
        if mi >= 65: return "Moderate maintainability"
        if mi >= 40: return "Low maintainability — refactoring recommended"
        return "Very low maintainability — immediate attention required"

    # ------------------------------------------------------------------
    # 3. Code Quality via Pylint
    # ------------------------------------------------------------------
    def _analyze_quality(self, file_path: str) -> Tuple[float, Dict[str, Any]]:
        """
        Run Pylint in JSON mode. Parse messages by category.
        Deduct per issue type: Error=-5, Warning=-2, Refactor=-1.5, Convention=-0.5
        """
        try:
            cmd = [
                sys.executable, "-m", "pylint", file_path,
                "--output-format=json",
                "--score=n",
                "--disable=all",
                "--enable=E,W,R,C",
            ]
            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=30
            )
            try:
                issues = json.loads(result.stdout or "[]")
            except json.JSONDecodeError:
                issues = []

            deductions = 0.0
            by_type: Dict[str, int] = {"error": 0, "warning": 0, "refactor": 0, "convention": 0}
            top_issues: List[Dict[str, Any]] = []

            for msg in issues:
                mtype = str(msg.get("type", "")).lower()
                if mtype == "error":
                    deductions += 5.0
                    by_type["error"] += 1
                elif mtype == "warning":
                    deductions += 2.0
                    by_type["warning"] += 1
                elif mtype == "refactor":
                    deductions += 1.5
                    by_type["refactor"] += 1
                elif mtype == "convention":
                    deductions += 0.5
                    by_type["convention"] += 1
                if len(top_issues) < 15:
                    top_issues.append({
                        "type": mtype,
                        "message": msg.get("message", ""),
                        "symbol": msg.get("symbol", ""),
                        "line": msg.get("line", 0),
                    })

            score = max(0.0, 100.0 - deductions)
            return score, {
                "issue_counts": by_type,
                "total_issues": len(issues),
                "deductions": deductions,
                "top_issues": top_issues,
            }
        except subprocess.TimeoutExpired:
            return 60.0, {"error": "Pylint timed out"}
        except Exception as exc:
            logger.warning(f"Pylint analysis failed: {exc}")
            return 60.0, {"error": str(exc)}

    # ------------------------------------------------------------------
    # 4. Security Analysis
    # ------------------------------------------------------------------
    def _analyze_security(self, code: str) -> Tuple[float, Dict[str, Any]]:
        """
        Regex-pattern scan for known insecure usage patterns.
        Each high-severity hit deducts 15 pts, medium 8 pts, low 3 pts.
        """
        HIGH_SEVERITY = {
            "eval()", "exec()", "pickle", "SQL injection",
            "Hardcoded password", "Hardcoded secret", "Hardcoded API key",
            "shell=True",
        }
        issues: List[Dict[str, Any]] = []
        deductions = 0.0

        for pattern, description in _SECURITY_PATTERNS:
            matches = list(re.finditer(pattern, code, re.IGNORECASE))
            if matches:
                # Determine severity
                severity = "high" if any(h in description for h in HIGH_SEVERITY) else (
                    "medium" if "injection" in description.lower() or "deserialization" in description.lower()
                    else "low"
                )
                ded = 15.0 if severity == "high" else (8.0 if severity == "medium" else 3.0)
                deductions += ded
                issues.append({
                    "description": description,
                    "severity":    severity,
                    "occurrences": len(matches),
                    "lines":       [m.start() for m in matches[:3]],  # first 3 match positions
                })

        score = max(0.0, 100.0 - deductions)
        return score, {
            "issues": issues,
            "total_issues": len(issues),
            "deductions": deductions,
        }

    # ------------------------------------------------------------------
    # 5. Documentation Coverage
    # ------------------------------------------------------------------
    def _analyze_documentation(self, code: str, tree: ast.AST) -> Tuple[float, Dict[str, Any]]:
        """
        Check module docstring, class docstrings, and function docstrings.
        Also measure comment density (lines with # vs total code lines).
        """
        try:
            functions = [n for n in ast.walk(tree) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
            classes   = [n for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]

            module_doc = bool(ast.get_docstring(tree))
            fn_with_doc = sum(1 for f in functions if ast.get_docstring(f))
            cls_with_doc = sum(1 for c in classes if ast.get_docstring(c))

            fn_ratio  = fn_with_doc  / len(functions) if functions else 1.0
            cls_ratio = cls_with_doc / len(classes)   if classes   else 1.0

            lines = code.splitlines()
            code_lines = [l for l in lines if l.strip() and not l.strip().startswith("#")]
            comment_lines = [l for l in lines if l.strip().startswith("#")]
            comment_density = len(comment_lines) / len(code_lines) if code_lines else 0.0

            score = (
                (20.0 if module_doc else 0.0)
                + fn_ratio  * 40.0
                + cls_ratio * 20.0
                + min(1.0, comment_density / 0.15) * 20.0  # ideal ~15% comment density
            )
            return round(score, 2), {
                "module_docstring": module_doc,
                "function_doc_ratio": round(fn_ratio, 2),
                "class_doc_ratio": round(cls_ratio, 2),
                "comment_density": round(comment_density, 3),
                "undocumented_functions": [
                    f.name for f in functions if not ast.get_docstring(f)
                ][:10],
            }
        except Exception as exc:
            return 50.0, {"error": str(exc)}

    # ------------------------------------------------------------------
    # 6. Duplication Detection
    # ------------------------------------------------------------------
    def _analyze_duplication(self, code: str) -> Tuple[float, Dict[str, Any]]:
        """
        Fingerprint 6-line sliding windows. If ≥2 windows share the same
        hash (normalised), flag them as duplicate blocks.
        """
        try:
            lines = [
                re.sub(r'\s+', ' ', l).strip()
                for l in code.splitlines()
                if l.strip() and not l.strip().startswith("#")
            ]
            window_size = 6
            if len(lines) < window_size:
                return 100.0, {"duplicate_blocks": 0, "duplicate_ratio": 0.0}

            hashes: List[str] = []
            for i in range(len(lines) - window_size + 1):
                window = "\n".join(lines[i:i + window_size])
                h = hashlib.md5(window.encode()).hexdigest()
                hashes.append(h)

            counts = Counter(hashes)
            duplicate_windows = sum(1 for cnt in counts.values() if cnt > 1)
            dup_ratio = duplicate_windows / len(hashes) if hashes else 0.0

            # Score: 0% dup→100, >30% dup→0
            score = max(0.0, 100.0 - dup_ratio * 333.0)
            return round(score, 2), {
                "duplicate_blocks": duplicate_windows,
                "total_windows": len(hashes),
                "duplicate_ratio": round(dup_ratio, 3),
                "interpretation": (
                    "No significant duplication" if dup_ratio < 0.05
                    else "Moderate duplication — consider refactoring" if dup_ratio < 0.15
                    else "High duplication — DRY principle violation"
                )
            }
        except Exception as exc:
            return 50.0, {"error": str(exc)}

    # ------------------------------------------------------------------
    # 7. Type-Safety Analysis
    # ------------------------------------------------------------------
    def _analyze_type_safety(self, tree: ast.AST) -> Tuple[float, Dict[str, Any]]:
        """
        Measure:
         - % of function arguments with type annotations (excl. self/cls)
         - % of functions with return type annotations
        """
        try:
            typed_args = 0
            total_args = 0
            typed_returns = 0
            total_fns = 0
            untyped_fns: List[str] = []

            for node in ast.walk(tree):
                if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    continue
                total_fns += 1
                has_return = node.returns is not None
                if has_return:
                    typed_returns += 1
                else:
                    untyped_fns.append(node.name)

                for arg in node.args.args:
                    if arg.arg in ("self", "cls"):
                        continue
                    total_args += 1
                    if arg.annotation is not None:
                        typed_args += 1

            arg_ratio = typed_args / total_args if total_args > 0 else 1.0
            ret_ratio = typed_returns / total_fns if total_fns > 0 else 1.0

            score = (arg_ratio * 60.0) + (ret_ratio * 40.0)
            return round(score, 2), {
                "arg_annotation_ratio":    round(arg_ratio, 2),
                "return_annotation_ratio": round(ret_ratio, 2),
                "typed_args":   typed_args,
                "total_args":   total_args,
                "typed_returns": typed_returns,
                "total_functions": total_fns,
                "untyped_functions": untyped_fns[:10],
            }
        except Exception as exc:
            return 50.0, {"error": str(exc)}

    # ------------------------------------------------------------------
    # Code Smell Detection
    # ------------------------------------------------------------------
    def _detect_smells(self, code: str, tree: ast.AST) -> List[Dict[str, Any]]:
        """Detect common code smells via AST and text heuristics."""
        smells: List[Dict[str, Any]] = []

        for node in ast.walk(tree):
            # Long functions
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                fn_lines = (node.end_lineno or 0) - node.lineno
                if fn_lines > 50:
                    smells.append({
                        "type": "long_function",
                        "description": f"Function '{node.name}' is {fn_lines} lines — consider splitting",
                        "line": node.lineno,
                        "severity": "warning",
                    })
                # Too many parameters
                params = [a for a in node.args.args if a.arg not in ("self", "cls")]
                if len(params) > 5:
                    smells.append({
                        "type": "too_many_params",
                        "description": f"Function '{node.name}' has {len(params)} parameters — consider a data class",
                        "line": node.lineno,
                        "severity": "warning",
                    })
                # Mutable default arguments
                for default in node.args.defaults:
                    if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                        smells.append({
                            "type": "mutable_default",
                            "description": f"Function '{node.name}' uses a mutable default argument",
                            "line": node.lineno,
                            "severity": "error",
                        })

            # Bare except
            if isinstance(node, ast.ExceptHandler) and node.type is None:
                smells.append({
                    "type": "bare_except",
                    "description": "Bare 'except:' clause — catches all exceptions including SystemExit",
                    "line": node.lineno,
                    "severity": "warning",
                })

            # global keyword
            if isinstance(node, ast.Global):
                smells.append({
                    "type": "global_usage",
                    "description": f"Global variable usage: {', '.join(node.names)}",
                    "line": node.lineno,
                    "severity": "info",
                })

        # Magic numbers
        magic = self._find_magic_numbers(tree)
        for m in magic[:5]:
            smells.append({
                "type": "magic_numbers",
                "description": f"Magic number '{m['value']}' at line {m['line']} — use a named constant",
                "line": m["line"],
                "severity": "info",
            })

        return smells

    def _find_magic_numbers(self, tree: ast.AST) -> List[Dict[str, Any]]:
        """Find numeric literals that are not 0 or 1 (common constants)."""
        magic: List[Dict[str, Any]] = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
                val = node.value
                # Skip 0, 1, -1, 2; those are common and acceptable
                if val not in (0, 1, -1, 2, 100, True, False):
                    magic.append({"value": val, "line": getattr(node, "lineno", 0)})
        return magic

    # ------------------------------------------------------------------
    # Basic Metrics (always included in details)
    # ------------------------------------------------------------------
    def _basic_metrics(self, code: str, tree: ast.AST) -> Dict[str, Any]:
        lines = code.splitlines()
        blank = sum(1 for l in lines if not l.strip())
        comment = sum(1 for l in lines if l.strip().startswith("#"))
        functions = [n for n in ast.walk(tree) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
        classes   = [n for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]
        imports   = [n for n in ast.walk(tree) if isinstance(n, (ast.Import, ast.ImportFrom))]
        return {
            "loc": {
                "total": len(lines),
                "code": len(lines) - blank - comment,
                "blank": blank,
                "comment": comment,
            },
            "functions_count": len(functions),
            "classes_count":   len(classes),
            "imports_count":   len(imports),
        }

    # ------------------------------------------------------------------
    # Grading
    # ------------------------------------------------------------------
    def _grade(self, score: float) -> str:
        if score >= 90: return "A+"
        if score >= 80: return "A"
        if score >= 70: return "B"
        if score >= 60: return "C"
        if score >= 50: return "D"
        return "F"

    # ------------------------------------------------------------------
    # Diagnostics (human-readable recommendations)
    # ------------------------------------------------------------------
    def _diagnostics(
        self,
        scores: Dict[str, float],
        smells: List[Dict[str, Any]],
        security: Dict[str, Any],
    ) -> List[str]:
        tips: List[str] = []

        if scores["complexity"] < 60:
            tips.append("🔴 High cyclomatic complexity — break large functions into smaller, single-responsibility units.")
        if scores["maintainability"] < 50:
            tips.append("🔴 Low maintainability index — reduce function length and avoid deeply nested logic.")
        if scores["quality"] < 70:
            tips.append("🟡 Pylint found significant issues — resolve errors and warnings before submission.")
        if scores["security"] < 80:
            tips.append("🔴 Security vulnerabilities detected — review flagged patterns immediately.")
        if scores["documentation"] < 60:
            tips.append("🟡 Insufficient documentation — add docstrings to all public functions and classes.")
        if scores["duplication"] < 70:
            tips.append("🟡 Code duplication detected — apply the DRY (Don't Repeat Yourself) principle.")
        if scores["type_safety"] < 50:
            tips.append("🟡 Low type annotation coverage — add type hints to improve IDE support and reliability.")

        smell_counts = Counter(s["type"] for s in smells)
        if smell_counts.get("long_function", 0) > 2:
            tips.append("🟡 Multiple long functions detected — aim for functions under 30 lines.")
        if smell_counts.get("bare_except", 0):
            tips.append("🔴 Bare except clauses should be replaced with specific exception types.")
        if smell_counts.get("mutable_default", 0):
            tips.append("🔴 Mutable default arguments cause shared-state bugs — use None and initialise inside.")

        security_highs = [s for s in security.get("issues", []) if s.get("severity") == "high"]
        if security_highs:
            for s in security_highs:
                tips.append(f"🔴 [SECURITY] {s['description']}")

        return tips

    # ------------------------------------------------------------------
    # Utilities
    # ------------------------------------------------------------------
    @staticmethod
    def _cache_key(file_path: str, path: Path) -> Optional[str]:
        """Cache key = path + file mtime. Returns None if stat fails."""
        try:
            mtime = path.stat().st_mtime
            return f"{file_path}:{mtime}"
        except OSError:
            return None

    @staticmethod
    def _error(message: str) -> Dict[str, Any]:
        return {
            "final_score": 0.0,
            "grade": "F",
            "scores": {k: 0.0 for k in _WEIGHTS},
            "complexity":      0.0,
            "maintainability": 0.0,
            "quality":         0.0,
            "error":           message,
            "details":         {},
            "code_smells":     [],
            "security_issues": [],
            "diagnostics":     [f"❌ Analysis failed: {message}"],
        }

    # Keep legacy alias
    def _get_default_error_response(self, message: str) -> Dict[str, Any]:
        return self._error(message)
