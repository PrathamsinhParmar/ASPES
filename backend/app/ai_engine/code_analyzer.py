"""
AI Engine - Code Quality Analyzer (v3 - hardened)

Analysis Dimensions:
  1. Cyclomatic Complexity   (radon.complexity)
  2. Maintainability Index   (radon.metrics)
  3. Code Quality / Linting  (pylint, sandboxed subprocess)
  4. Security Analysis       (AST-based call/assignment scanning)
  5. Documentation Coverage  (docstrings + comment density)
  6. Code Duplication        (heuristic duplicate-block detection)
  7. Type-Safety             (annotation coverage for functions/params)

Final score = weighted average of all 7 dimensions.

SECURITY NOTES
--------------
- Pylint is static analysis and does not execute the target module, but it
  WILL import any checker plugin named in a discovered pylintrc/pyproject.toml
  /setup.cfg. To prevent a submitted project from smuggling in a malicious
  plugin, we (a) always pass an explicit, empty, locked-down --rcfile so
  config auto-discovery never runs, and (b) copy the single target file into
  an isolated, throwaway temp directory before invoking pylint, so no
  ancestor config file in the original upload tree can ever be found.
- The security scanner is AST-based rather than regex-on-raw-text. This
  avoids flagging matches inside comments/docstrings and correctly resolves
  simple import aliasing (e.g. `from os import system as s`).
- As defense-in-depth beyond this module, the calling service should still
  run the grading worker with a restricted OS user, no outbound network
  access, and a CPU/memory-limited sandbox (e.g. a locked-down container),
  since no static analyzer can offer a 100% guarantee against a sufficiently
  creative submission.
"""

from __future__ import annotations

import ast
import hashlib
import json
import logging
import os
import re
import shutil
import subprocess
import sys
import tempfile
from collections import Counter, OrderedDict
from pathlib import Path
from threading import Lock
from typing import Any, Dict, List, Optional, Tuple

import radon.complexity as cc
import radon.metrics as rm

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Scoring weights (must sum to 1.0)
# ---------------------------------------------------------------------------
_WEIGHTS: Dict[str, float] = {
    "complexity":      0.20,
    "maintainability": 0.15,
    "quality":         0.20,
    "security":        0.20,
    "documentation":   0.10,
    "duplication":     0.08,
    "type_safety":     0.07,
}

_MAX_FILE_SIZE_MB = 5
_PYLINT_TIMEOUT_SECONDS = 30
_MAX_CACHE_ENTRIES = 256
_MAX_DEDUCTION_OCCURRENCES = 5  # diminishing returns cap per issue type

# SQL keywords used by the (AST-based) injection heuristics
_SQL_KEYWORDS_RE = re.compile(
    r"\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b", re.IGNORECASE
)

# Names that, when assigned a literal string, look like hardcoded credentials
_SECRET_NAME_RE = re.compile(
    r"(pass(word)?|secret|token|api[_-]?key|access[_-]?key)", re.IGNORECASE
)
_SECRET_PLACEHOLDER_VALUES = {
    "", "changeme", "change_me", "xxx", "todo", "password", "secret",
    "your_password_here", "insert_here", "example", "test", "<password>",
}

# Canonical dangerous call targets -> (severity, description)
_DANGEROUS_CALLS: Dict[str, Tuple[str, str]] = {
    "eval":            ("high",   "Use of eval() — arbitrary code execution risk"),
    "exec":            ("high",   "Use of exec() — arbitrary code execution risk"),
    "os.system":       ("high",   "Use of os.system() — shell injection risk"),
    "os.popen":        ("high",   "Use of os.popen() — shell injection risk"),
    "pickle.load":     ("high",   "Use of pickle.load() — untrusted deserialization risk"),
    "pickle.loads":    ("high",   "Use of pickle.loads() — untrusted deserialization risk"),
    "marshal.loads":   ("high",   "Use of marshal.loads() — untrusted deserialization risk"),
    "pickle.dump":     ("low",    "Use of pickle.dump() — consider a safer serialization format"),
    "pickle.dumps":    ("low",    "Use of pickle.dumps() — consider a safer serialization format"),
    "hashlib.md5":     ("low",    "Weak hash algorithm MD5 used"),
    "hashlib.sha1":    ("low",    "Weak hash algorithm SHA-1 used"),
}

_SMELL_NAMES = {
    "long_function":   "Functions with more than 50 lines",
    "too_many_params": "Functions with more than 5 parameters",
    "bare_except":     "Bare except: clauses",
    "global_usage":    "Use of global keyword",
    "mutable_default": "Mutable default argument (list/dict/set as default)",
    "magic_numbers":   "Magic numbers (unexplained numeric literals)",
}


# ---------------------------------------------------------------------------
# AST helpers
# ---------------------------------------------------------------------------
class _ImportAliasResolver(ast.NodeVisitor):
    """Builds a map of local name -> canonical dotted name for imports,
    so `import os as o; o.system(...)` still resolves to `os.system`."""

    def __init__(self) -> None:
        self.aliases: Dict[str, str] = {}

    def visit_Import(self, node: ast.Import) -> None:
        for alias in node.names:
            local = alias.asname or alias.name.split(".")[0]
            self.aliases[local] = alias.name
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        module = node.module or ""
        for alias in node.names:
            local = alias.asname or alias.name
            canonical = f"{module}.{alias.name}" if module else alias.name
            self.aliases[local] = canonical
        self.generic_visit(node)


def _resolve_call_name(func: ast.expr, aliases: Dict[str, str]) -> Optional[str]:
    """Resolve a Call's func expression (Name or Attribute chain) to a
    best-effort canonical dotted name, honoring import aliases."""
    parts: List[str] = []
    node = func
    while isinstance(node, ast.Attribute):
        parts.append(node.attr)
        node = node.value
    if isinstance(node, ast.Name):
        parts.append(node.id)
    else:
        return None
    parts.reverse()
    if not parts:
        return None
    head = aliases.get(parts[0], parts[0])
    return ".".join([head] + parts[1:])


def _string_has_sql_keyword(value: Any) -> bool:
    return isinstance(value, str) and bool(_SQL_KEYWORDS_RE.search(value))


class _SecurityVisitor(ast.NodeVisitor):
    """Single-pass AST visitor that finds dangerous calls, hardcoded
    secrets, unsafe deserialization, and SQL-injection-shaped string
    building. Operates on parsed nodes only, so comments/docstrings that
    merely *mention* a dangerous function are never mistaken for its use.
    """

    def __init__(self, aliases: Dict[str, str]) -> None:
        self.aliases = aliases
        # description -> (severity, occurrence_count)
        self.findings: "OrderedDict[str, Tuple[str, int]]" = OrderedDict()

    def _record(self, description: str, severity: str) -> None:
        if description in self.findings:
            existing_sev, count = self.findings[description]
            self.findings[description] = (existing_sev, count + 1)
        else:
            self.findings[description] = (severity, 1)

    # -- dangerous calls, hardcoded secrets in call kwargs, yaml.load, subprocess shell=True --
    def visit_Call(self, node: ast.Call) -> None:
        name = _resolve_call_name(node.func, self.aliases)
        if name:
            if name in _DANGEROUS_CALLS:
                severity, desc = _DANGEROUS_CALLS[name]
                self._record(desc, severity)
            elif name in ("subprocess.run", "subprocess.call", "subprocess.Popen", "subprocess.check_output"):
                for kw in node.keywords:
                    if kw.arg == "shell" and isinstance(kw.value, ast.Constant) and kw.value.value is True:
                        self._record(
                            f"{name}(..., shell=True) — shell injection risk", "high"
                        )
            elif name == "yaml.load":
                safe_loader = False
                for kw in node.keywords:
                    if kw.arg == "Loader":
                        loader_name = _resolve_call_name(kw.value, self.aliases) if isinstance(kw.value, ast.Attribute) else None
                        if loader_name and "SafeLoader" in loader_name:
                            safe_loader = True
                if not safe_loader:
                    self._record(
                        "yaml.load() without SafeLoader — arbitrary object deserialization risk",
                        "high",
                    )
            elif name.endswith(".format") and isinstance(node.func, ast.Attribute):
                base = node.func.value
                if isinstance(base, ast.Constant) and _string_has_sql_keyword(base.value):
                    self._record(
                        "Possible SQL injection via str.format() on a query string", "medium"
                    )
        self.generic_visit(node)

    # -- hardcoded credential-like literals --
    def visit_Assign(self, node: ast.Assign) -> None:
        value = node.value
        if isinstance(value, ast.Constant) and isinstance(value.value, str):
            for target in node.targets:
                if isinstance(target, ast.Name) and _SECRET_NAME_RE.search(target.id):
                    stripped = value.value.strip()
                    if len(stripped) >= 4 and stripped.lower() not in _SECRET_PLACEHOLDER_VALUES:
                        self._record(
                            f"Hardcoded credential-like value assigned to '{target.id}'",
                            "high",
                        )
        self.generic_visit(node)

    # -- SQL injection via string concatenation ("SELECT ..." + var) or % formatting --
    def visit_BinOp(self, node: ast.BinOp) -> None:
        if isinstance(node.op, ast.Add):
            for side in (node.left, node.right):
                if isinstance(side, ast.Constant) and _string_has_sql_keyword(side.value):
                    self._record(
                        "Possible SQL injection via string concatenation", "medium"
                    )
                    break
        elif isinstance(node.op, ast.Mod):
            if isinstance(node.left, ast.Constant) and _string_has_sql_keyword(node.left.value):
                self._record(
                    "Possible SQL injection via %-style string formatting", "medium"
                )
        self.generic_visit(node)

    # -- SQL injection via f-strings --
    def visit_JoinedStr(self, node: ast.JoinedStr) -> None:
        has_sql = any(
            isinstance(v, ast.Constant) and _string_has_sql_keyword(v.value)
            for v in node.values
        )
        has_interpolation = any(isinstance(v, ast.FormattedValue) for v in node.values)
        if has_sql and has_interpolation:
            self._record(
                "Possible SQL injection via f-string interpolation", "medium"
            )
        self.generic_visit(node)


class CodeAnalyzer:
    """
    Multi-dimensional Python code quality analyzer. Performs 7 independent
    analyses and produces a weighted final score alongside rich per-dimension
    details and actionable diagnostics.
    """

    def __init__(self, allowed_base_dir: Optional[str] = None) -> None:
        """
        Args:
            allowed_base_dir: if provided, analyze() refuses any path that
                doesn't resolve inside this directory (defense-in-depth
                against path traversal from upstream bugs).
        """
        self.weights = _WEIGHTS
        self._allowed_base_dir = Path(allowed_base_dir).resolve() if allowed_base_dir else None
        self._cache: "OrderedDict[str, Dict[str, Any]]" = OrderedDict()
        self._cache_lock = Lock()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def analyze(self, file_path: str) -> Dict[str, Any]:
        """
        Full analysis of a single Python source file.

        Args:
            file_path: Absolute or relative path to the .py file.

        Returns:
            Comprehensive analysis dict with final_score, per-dimension
            scores, details, smells, security_issues, and diagnostics.
        """
        try:
            path = Path(file_path).resolve()
        except OSError:
            return self._error("Invalid file path")

        if self._allowed_base_dir is not None:
            try:
                path.relative_to(self._allowed_base_dir)
            except ValueError:
                logger.warning("Rejected out-of-bounds analysis path: %s", path)
                return self._error("File path is outside the permitted directory")

        if not path.exists() or not path.is_file():
            return self._error("File not found")

        try:
            size_mb = path.stat().st_size / (1024 * 1024)
            if size_mb > _MAX_FILE_SIZE_MB:
                return self._error(f"File too large ({size_mb:.1f} MB) — limit is {_MAX_FILE_SIZE_MB} MB")
        except OSError:
            pass

        if path.suffix != ".py":
            return self._error(
                f"Unsupported file type '{path.suffix}' — this analyzer currently supports .py only"
            )

        cache_key = self._cache_key(str(path), path)
        if cache_key:
            with self._cache_lock:
                cached = self._cache.get(cache_key)
                if cached is not None:
                    self._cache.move_to_end(cache_key)
                    return cached

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

        result = self._run_all_analyses(code, tree, str(path))

        if cache_key:
            with self._cache_lock:
                self._cache[cache_key] = result
                self._cache.move_to_end(cache_key)
                while len(self._cache) > _MAX_CACHE_ENTRIES:
                    self._cache.popitem(last=False)
        return result

    def analyze_project(self, file_paths: List[str]) -> Dict[str, Any]:
        """
        Analyze every Python file in a multi-file submission (e.g. extracted
        from a zip) and return per-file results plus an aggregate score,
        weighted by lines of code so larger modules count proportionally
        more than a two-line utility file.

        The returned dict contains the same top-level metric keys as
        analyze() so the frontend Metric Breakdown always has data,
        regardless of whether a single file or a zip was submitted.
        """
        per_file: Dict[str, Dict[str, Any]] = {}
        # LOC-weighted sums for each dimension
        weighted_sum          = 0.0
        weighted_clean_code   = 0.0
        weighted_maint        = 0.0
        weighted_complexity   = 0.0
        weighted_security     = 0.0
        weighted_doc          = 0.0
        weighted_dup          = 0.0
        weighted_type         = 0.0
        total_weight          = 0.0
        all_smells:         List[Dict[str, Any]] = []
        all_security_issues: List[Dict[str, Any]] = []

        py_files = [p for p in file_paths if p.endswith(".py")]
        if not py_files:
            return self._error("No Python (.py) files found in submission")

        for fp in py_files:
            result = self.analyze(fp)
            per_file[fp] = result
            loc = result.get("details", {}).get("loc", {}).get("code", 0) or 1
            scores = result.get("scores", {})

            weighted_sum        += result.get("final_score",       0.0) * loc
            # Use the frontend-facing aliases (set by analyze()) as the source
            weighted_clean_code += result.get("clean_code_score",      0.0) * loc
            weighted_maint      += result.get("maintainability_index", 0.0) * loc
            weighted_complexity += result.get("complexity_score",      0.0) * loc
            weighted_security   += scores.get("security",              0.0) * loc
            weighted_doc        += scores.get("documentation",         0.0) * loc
            weighted_dup        += scores.get("duplication",           0.0) * loc
            weighted_type       += scores.get("type_safety",           0.0) * loc
            total_weight        += loc

            all_smells.extend(result.get("code_smells", []))
            all_security_issues.extend(result.get("security_issues", []))

        def _w(s: float) -> float:
            return round(s / total_weight, 2) if total_weight else 0.0

        aggregate_score      = _w(weighted_sum)
        agg_clean_code       = _w(weighted_clean_code)
        agg_maint            = _w(weighted_maint)
        agg_complexity       = _w(weighted_complexity)
        agg_security         = _w(weighted_security)
        agg_doc              = _w(weighted_doc)
        agg_dup              = _w(weighted_dup)
        agg_type             = _w(weighted_type)

        return {
            "final_score":    aggregate_score,
            "grade":          self._grade(aggregate_score),
            "files_analyzed": len(py_files),
            "per_file":       per_file,
            "code_smells":    all_smells,
            "security_issues": all_security_issues,
            # Aggregate dimension scores (same structure as analyze())
            "scores": {
                "quality":         agg_clean_code,
                "maintainability": agg_maint,
                "complexity":      agg_complexity,
                "security":        agg_security,
                "documentation":   agg_doc,
                "duplication":     agg_dup,
                "type_safety":     agg_type,
            },
            # Backwards-compatible aliases
            "quality":         agg_clean_code,
            "maintainability": agg_maint,
            "complexity":      agg_complexity,
            # ------------------------------------------------------------------
            # Frontend Metric Breakdown aliases — LOC-weighted across all files
            # These match the exact keys CodeAnalyzerPage.jsx reads:
            #   clean_code_score      -> Structural Modularity (Clean Code)
            #   maintainability_index -> Maintainability Index
            #   complexity_score      -> Cognitive Complexity (inverse)
            # ------------------------------------------------------------------
            "clean_code_score":      agg_clean_code,
            "maintainability_index": agg_maint,
            "complexity_score":      agg_complexity,
        }

    # ------------------------------------------------------------------
    # Orchestration
    # ------------------------------------------------------------------
    def _run_all_analyses(self, code: str, tree: ast.AST, file_path: str) -> Dict[str, Any]:
        complexity_score,      complexity_detail = self._analyze_complexity(code)
        maintainability_score, maint_detail      = self._analyze_maintainability(code)
        quality_score,         quality_detail    = self._analyze_quality(file_path)
        security_score,        security_detail   = self._analyze_security(tree)
        doc_score,             doc_detail         = self._analyze_documentation(code, tree)
        dup_score,             dup_detail         = self._analyze_duplication(code)
        type_score,            type_detail        = self._analyze_type_safety(tree)

        scores = {
            "complexity":      complexity_score,
            "maintainability": maintainability_score,
            "quality":         quality_score,
            "security":        security_score,
            "documentation":   doc_score,
            "duplication":     dup_score,
            "type_safety":     type_score,
        }

        final_score = sum(scores[dim] * self.weights[dim] for dim in self.weights)
        final_score = round(max(0.0, min(100.0, final_score)), 2)

        smells = self._detect_smells(tree)
        grade = self._grade(final_score)

        return {
            "final_score": final_score,
            "grade": grade,
            "scores": {k: round(v, 2) for k, v in scores.items()},
            "weights": self.weights,
            # backwards-compatible top-level aliases
            "complexity":      round(complexity_score, 2),
            "maintainability": round(maintainability_score, 2),
            "quality":         round(quality_score, 2),
            # ------------------------------------------------------------------
            # Frontend Metric Breakdown aliases
            # CodeAnalyzerPage.jsx reads these three specific keys:
            #   clean_code_score    -> Structural Modularity (Clean Code)
            #                         = Pylint quality score (0-100)
            #   maintainability_index -> Maintainability Index
            #                         = Radon MI-derived score (0-100)
            #   complexity_score    -> Cognitive Complexity (inverse)
            #                         = inverted cyclomatic complexity (0-100,
            #                           higher = simpler = better)
            # ------------------------------------------------------------------
            "clean_code_score":      round(quality_score, 2),
            "maintainability_index": round(maintainability_score, 2),
            "complexity_score":      round(complexity_score, 2),
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
            "code_smells":     smells,
            "security_issues": security_detail.get("issues", []),
            "diagnostics":     self._diagnostics(scores, smells, security_detail),
        }

    # ------------------------------------------------------------------
    # 1. Cyclomatic Complexity
    # ------------------------------------------------------------------
    def _analyze_complexity(self, code: str) -> Tuple[float, Dict[str, Any]]:
        """Score = max(0, 100 - avg_complexity * 8), continuous (no cliff)."""
        try:
            blocks = cc.cc_visit(code)
            if not blocks:
                return 100.0, {"average": 0, "max": 0, "per_function": []}

            complexities = [b.complexity for b in blocks]
            avg = sum(complexities) / len(complexities)
            max_c = max(complexities)

            score = max(0.0, 100.0 - avg * 8.0)

            per_fn = sorted(
                [{"name": b.name, "complexity": b.complexity, "rank": b.letter} for b in blocks],
                key=lambda x: x["complexity"], reverse=True,
            )
            return score, {
                "average": round(avg, 2),
                "max": max_c,
                "distribution": self._complexity_distribution(complexities),
                "per_function": per_fn[:20],
            }
        except Exception as exc:
            logger.warning("Complexity analysis failed: %s", exc)
            return 50.0, {"error": str(exc)}

    def _complexity_distribution(self, complexities: List[int]) -> Dict[str, int]:
        """Radon risk bands: A(1-5), B(6-10), C(11-15), D(16-20), E(21-25), F(26+)."""
        dist = {"A": 0, "B": 0, "C": 0, "D": 0, "E": 0, "F": 0}
        for c in complexities:
            if c <= 5:    dist["A"] += 1
            elif c <= 10: dist["B"] += 1
            elif c <= 15: dist["C"] += 1
            elif c <= 20: dist["D"] += 1
            elif c <= 25: dist["E"] += 1
            else:         dist["F"] += 1
        return dist

    # ------------------------------------------------------------------
    # 2. Maintainability Index
    # ------------------------------------------------------------------
    def _analyze_maintainability(self, code: str) -> Tuple[float, Dict[str, Any]]:
        """
        Radon MI ranges 0-100. Applies a smooth, continuous penalty curve
        (score = 100 * (mi/100)^1.4) instead of piecewise thresholds, so a
        one-point change in MI never causes a disproportionate score jump.
        """
        try:
            mi = float(rm.mi_visit(code, multi=True))
            mi = max(0.0, min(100.0, mi))
            score = 100.0 * (mi / 100.0) ** 1.4
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
    # 3. Code Quality via Pylint (sandboxed)
    # ------------------------------------------------------------------
    def _analyze_quality(self, file_path: str) -> Tuple[float, Dict[str, Any]]:
        """
        Run Pylint in an isolated temp directory with an explicit, empty
        --rcfile so it can never auto-discover (and load plugins from) a
        pylintrc/pyproject.toml/setup.cfg bundled inside the submission.
        Deduct per issue type: Error=-5, Warning=-2, Refactor=-1.5, Convention=-0.5
        """
        sandbox_dir = None
        try:
            sandbox_dir = tempfile.mkdtemp(prefix="pylint_sandbox_")
            safe_rcfile = os.path.join(sandbox_dir, ".empty_pylintrc")
            # Explicitly empty and non-plugin-loading; passing --rcfile
            # disables pylint's ancestor-directory config auto-discovery.
            with open(safe_rcfile, "w", encoding="utf-8") as fh:
                fh.write("[MASTER]\nload-plugins=\npersistent=no\n")

            sandboxed_target = os.path.join(sandbox_dir, "submission.py")
            shutil.copyfile(file_path, sandboxed_target)

            cmd = [
                sys.executable, "-m", "pylint", "submission.py",
                f"--rcfile={safe_rcfile}",
                "--output-format=json",
                "--score=n",
                "--disable=all",
                "--enable=E,W,R,C",
            ]
            env = {
                "PATH": os.environ.get("PATH", ""),
                "HOME": sandbox_dir,   # prevents ~/.pylintrc discovery
                "PYTHONPATH": "",      # prevents module-hijack via inherited sys.path
            }
            result = subprocess.run(
                cmd,
                cwd=sandbox_dir,
                capture_output=True,
                text=True,
                timeout=_PYLINT_TIMEOUT_SECONDS,
                env=env,
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
                per_issue = {"error": 5.0, "warning": 2.0, "refactor": 1.5, "convention": 0.5}.get(mtype)
                if per_issue is not None:
                    deductions += per_issue
                    by_type[mtype] += 1
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
            logger.warning("Pylint analysis failed: %s", exc)
            return 60.0, {"error": str(exc)}
        finally:
            if sandbox_dir:
                shutil.rmtree(sandbox_dir, ignore_errors=True)

    # ------------------------------------------------------------------
    # 4. Security Analysis (AST-based)
    # ------------------------------------------------------------------
    def _analyze_security(self, tree: ast.AST) -> Tuple[float, Dict[str, Any]]:
        """
        AST-based scan for dangerous calls, hardcoded secrets, unsafe
        deserialization, and SQL-injection-shaped string building.
        Deductions scale with occurrence count (capped for diminishing
        returns) instead of firing once no matter how many times an
        issue recurs.
        """
        resolver = _ImportAliasResolver()
        resolver.visit(tree)

        visitor = _SecurityVisitor(resolver.aliases)
        visitor.visit(tree)

        issues: List[Dict[str, Any]] = []
        deductions = 0.0
        base_deduction = {"high": 15.0, "medium": 8.0, "low": 3.0}

        for description, (severity, count) in visitor.findings.items():
            effective_count = min(count, _MAX_DEDUCTION_OCCURRENCES)
            ded = base_deduction[severity] * effective_count
            deductions += ded
            issues.append({
                "description": description,
                "severity": severity,
                "occurrences": count,
            })

        score = max(0.0, 100.0 - deductions)
        return score, {
            "issues": issues,
            "total_issues": len(issues),
            "deductions": round(deductions, 2),
        }

    # ------------------------------------------------------------------
    # 5. Documentation Coverage
    # ------------------------------------------------------------------
    def _analyze_documentation(self, code: str, tree: ast.AST) -> Tuple[float, Dict[str, Any]]:
        """Module/class/function docstring coverage plus comment density."""
        try:
            functions = [n for n in ast.walk(tree) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
            classes = [n for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]

            module_doc = bool(ast.get_docstring(tree))
            fn_with_doc = sum(1 for f in functions if ast.get_docstring(f))
            cls_with_doc = sum(1 for c in classes if ast.get_docstring(c))

            fn_ratio = fn_with_doc / len(functions) if functions else 1.0
            cls_ratio = cls_with_doc / len(classes) if classes else 1.0

            comment_density = self._comment_density(code)

            score = (
                (20.0 if module_doc else 0.0)
                + fn_ratio * 40.0
                + cls_ratio * 20.0
                + min(1.0, comment_density / 0.15) * 20.0
            )
            return round(score, 2), {
                "module_docstring": module_doc,
                "function_doc_ratio": round(fn_ratio, 2),
                "class_doc_ratio": round(cls_ratio, 2),
                "comment_density": round(comment_density, 3),
                "undocumented_functions": [f.name for f in functions if not ast.get_docstring(f)][:10],
            }
        except Exception as exc:
            return 50.0, {"error": str(exc)}

    @staticmethod
    def _comment_density(code: str) -> float:
        lines = code.splitlines()
        code_lines = [l for l in lines if l.strip() and not l.strip().startswith("#")]
        comment_lines = [l for l in lines if l.strip().startswith("#")]
        return len(comment_lines) / len(code_lines) if code_lines else 0.0

    # ------------------------------------------------------------------
    # 6. Duplication Detection
    # ------------------------------------------------------------------
    def _analyze_duplication(self, code: str) -> Tuple[float, Dict[str, Any]]:
        """Fingerprint 6-line sliding windows to flag likely duplicate blocks."""
        try:
            lines = [
                re.sub(r"\s+", " ", l).strip()
                for l in code.splitlines()
                if l.strip() and not l.strip().startswith("#")
            ]
            window_size = 6
            if len(lines) < window_size:
                return 100.0, {"duplicate_blocks": 0, "duplicate_ratio": 0.0}

            hashes: List[str] = []
            for i in range(len(lines) - window_size + 1):
                window = "\n".join(lines[i:i + window_size])
                h = hashlib.sha256(window.encode()).hexdigest()
                hashes.append(h)

            counts = Counter(hashes)
            duplicate_windows = sum(1 for cnt in counts.values() if cnt > 1)
            dup_ratio = duplicate_windows / len(hashes) if hashes else 0.0

            score = max(0.0, 100.0 - dup_ratio * (100.0 / 0.30))
            return round(score, 2), {
                "duplicate_blocks": duplicate_windows,
                "total_windows": len(hashes),
                "duplicate_ratio": round(dup_ratio, 3),
                "interpretation": (
                    "No significant duplication" if dup_ratio < 0.05
                    else "Moderate duplication — consider refactoring" if dup_ratio < 0.15
                    else "High duplication — DRY principle violation"
                ),
            }
        except Exception as exc:
            return 50.0, {"error": str(exc)}

    # ------------------------------------------------------------------
    # 7. Type-Safety Analysis
    # ------------------------------------------------------------------
    def _analyze_type_safety(self, tree: ast.AST) -> Tuple[float, Dict[str, Any]]:
        """
        Measures annotation coverage across ALL parameter kinds
        (positional, positional-only, keyword-only, *args, **kwargs) —
        not just `args.args` — so a function can't get a free pass by
        using only keyword-only parameters.
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
                if node.returns is not None:
                    typed_returns += 1
                else:
                    untyped_fns.append(node.name)

                all_params: List[ast.arg] = []
                all_params.extend(node.args.args)
                all_params.extend(getattr(node.args, "posonlyargs", []))
                all_params.extend(node.args.kwonlyargs)
                if node.args.vararg:
                    all_params.append(node.args.vararg)
                if node.args.kwarg:
                    all_params.append(node.args.kwarg)

                for arg in all_params:
                    if arg.arg in ("self", "cls"):
                        continue
                    total_args += 1
                    if arg.annotation is not None:
                        typed_args += 1

            arg_ratio = typed_args / total_args if total_args > 0 else 1.0
            ret_ratio = typed_returns / total_fns if total_fns > 0 else 1.0

            score = (arg_ratio * 60.0) + (ret_ratio * 40.0)
            return round(score, 2), {
                "arg_annotation_ratio": round(arg_ratio, 2),
                "return_annotation_ratio": round(ret_ratio, 2),
                "typed_args": typed_args,
                "total_args": total_args,
                "typed_returns": typed_returns,
                "total_functions": total_fns,
                "untyped_functions": untyped_fns[:10],
            }
        except Exception as exc:
            return 50.0, {"error": str(exc)}

    # ------------------------------------------------------------------
    # Code Smell Detection
    # ------------------------------------------------------------------
    def _detect_smells(self, tree: ast.AST) -> List[Dict[str, Any]]:
        smells: List[Dict[str, Any]] = []

        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                fn_lines = (node.end_lineno or 0) - node.lineno
                if fn_lines > 50:
                    smells.append({
                        "type": "long_function",
                        "description": f"Function '{node.name}' is {fn_lines} lines — consider splitting",
                        "line": node.lineno,
                        "severity": "warning",
                    })
                params = [a for a in node.args.args if a.arg not in ("self", "cls")]
                if len(params) > 5:
                    smells.append({
                        "type": "too_many_params",
                        "description": f"Function '{node.name}' has {len(params)} parameters — consider a data class",
                        "line": node.lineno,
                        "severity": "warning",
                    })
                for default in node.args.defaults:
                    if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                        smells.append({
                            "type": "mutable_default",
                            "description": f"Function '{node.name}' uses a mutable default argument",
                            "line": node.lineno,
                            "severity": "error",
                        })

            if isinstance(node, ast.ExceptHandler) and node.type is None:
                smells.append({
                    "type": "bare_except",
                    "description": "Bare 'except:' clause — catches all exceptions including SystemExit",
                    "line": node.lineno,
                    "severity": "warning",
                })

            if isinstance(node, ast.Global):
                smells.append({
                    "type": "global_usage",
                    "description": f"Global variable usage: {', '.join(node.names)}",
                    "line": node.lineno,
                    "severity": "info",
                })

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
        magic: List[Dict[str, Any]] = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)) and not isinstance(node.value, bool):
                val = node.value
                if val not in (0, 1, -1, 2, 100):
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
        classes = [n for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]
        imports = [n for n in ast.walk(tree) if isinstance(n, (ast.Import, ast.ImportFrom))]

        return {
            "loc": {
                "total": len(lines),
                "code": len(lines) - blank - comment,
                "blank": blank,
                "comment": comment,
            },
            "functions_count": len(functions),
            "classes_count": len(classes),
            "imports_count": len(imports),
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

        for issue in security.get("issues", []):
            if issue.get("severity") == "high":
                tips.append(f"🔴 [SECURITY] {issue['description']}")

        return tips

    # ------------------------------------------------------------------
    # Utilities
    # ------------------------------------------------------------------
    @staticmethod
    def _cache_key(file_path: str, path: Path) -> Optional[str]:
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
            "complexity": 0.0,
            "maintainability": 0.0,
            "quality": 0.0,
            # Frontend Metric Breakdown aliases — always present
            "clean_code_score":      0.0,
            "maintainability_index": 0.0,
            "complexity_score":      0.0,
            "error": message,
            "details": {},
            "code_smells": [],
            "security_issues": [],
            "diagnostics": [f"❌ Analysis failed: {message}"],
        }