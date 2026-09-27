"""
AI Engine - Plagiarism Detector (v2 - hardened & integrated)

Detects code plagiarism using semantic similarity (Sentence-BERT) with an
identifier-anonymized structural heuristic fallback when the ML model is unavailable.
Includes methods for standalone analysis, database integration, caching,
and generating human-readable reports and UI-ready breakdowns.
"""

from __future__ import annotations

import ast
import hashlib
import keyword
import logging
import os
import re
import threading
from collections import OrderedDict
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.project import Project

logger = logging.getLogger(__name__)

# Suppress verbose TensorFlow / Transformers startup warnings
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")
os.environ.setdefault("TRANSFORMERS_NO_ADVISORY_WARNINGS", "true")

# ---------------------------------------------------------------------------
# Lazy-loaded singleton, with a failure sentinel distinct from "not tried yet"
# ---------------------------------------------------------------------------
_sbert_model: Any = None
_sbert_load_attempted: bool = False
_sbert_lock = threading.Lock()

_SBERT_MODEL_NAME = "all-MiniLM-L6-v2"


def _get_sbert() -> Any:
    """
    Lazy-load Sentence-BERT model exactly once per process. If loading
    fails (missing package, no network access to fetch weights, version conflict,
    etc.) we remember that and never retry, so a broken environment doesn't hang
    or slow down evaluation tasks retrying a doomed model load.
    """
    global _sbert_model, _sbert_load_attempted
    if _sbert_load_attempted:
        return _sbert_model

    with _sbert_lock:
        if _sbert_load_attempted:  # re-check after acquiring the lock
            return _sbert_model
        try:
            from sentence_transformers import SentenceTransformer
            _sbert_model = SentenceTransformer(_SBERT_MODEL_NAME)
            logger.info("Sentence-BERT model '%s' loaded for plagiarism detection.", _SBERT_MODEL_NAME)
        except Exception as exc:
            logger.warning(
                "Sentence-BERT unavailable (%s). Plagiarism detector will use the "
                "structural fallback heuristic for this process's lifetime.", exc
            )
            _sbert_model = None
        finally:
            _sbert_load_attempted = True
    return _sbert_model


def reset_sbert_cache_for_testing() -> None:
    """Test-only helper to force _get_sbert() to retry on the next call."""
    global _sbert_model, _sbert_load_attempted
    _sbert_model = None
    _sbert_load_attempted = False


def reset_sbert_cache_for_test() -> None:
    """Alias for reset_sbert_cache_for_testing."""
    reset_sbert_cache_for_testing()


# ---------------------------------------------------------------------------
# AST Transforms: String Literal Masking & Identifier Anonymization
# ---------------------------------------------------------------------------
import builtins as _builtins_module

_BUILTIN_NAMES = set(dir(_builtins_module))
_KEEP_NAMES = {"self", "cls"} | set(keyword.kwlist) | _BUILTIN_NAMES
_DUNDER_RE = re.compile(r"^__.*__$")


class _StringLiteralMasker(ast.NodeTransformer):
    """Replaces string constants with a fixed placeholder at AST level to avoid
    superficial string differences affecting comparisons."""

    def visit_Constant(self, node: ast.Constant) -> ast.AST:
        if isinstance(node.value, str):
            return ast.copy_location(ast.Constant(value="STR"), node)
        return node


class _IdentifierAnonymizer(ast.NodeTransformer):
    """
    Renames locally-defined variables, functions, and classes to positional
    placeholders (v0, v1, fn0, fn1, cls0, cls1, ...) based on first-occurrence
    order, so that submissions differing only by renamed identifiers
    normalize to near-identical text.
    """

    def __init__(self) -> None:
        self._var_map: Dict[str, str] = {}
        self._fn_map: Dict[str, str] = {}
        self._cls_map: Dict[str, str] = {}

    def _var_name(self, original: str) -> str:
        if original in _KEEP_NAMES or _DUNDER_RE.match(original):
            return original
        if original not in self._var_map:
            self._var_map[original] = f"v{len(self._var_map)}"
        return self._var_map[original]

    def _fn_name(self, original: str) -> str:
        if _DUNDER_RE.match(original):
            return original
        if original not in self._fn_map:
            self._fn_map[original] = f"fn{len(self._fn_map)}"
        return self._fn_map[original]

    def _cls_name(self, original: str) -> str:
        if original not in self._cls_map:
            self._cls_map[original] = f"cls{len(self._cls_map)}"
        return self._cls_map[original]

    def visit_FunctionDef(self, node: ast.FunctionDef) -> ast.AST:
        node.name = self._fn_name(node.name)
        self._anonymize_args(node.args)
        self.generic_visit(node)
        return node

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> ast.AST:
        node.name = self._fn_name(node.name)
        self._anonymize_args(node.args)
        self.generic_visit(node)
        return node

    def visit_ClassDef(self, node: ast.ClassDef) -> ast.AST:
        node.name = self._cls_name(node.name)
        self.generic_visit(node)
        return node

    def visit_Name(self, node: ast.Name) -> ast.AST:
        node.id = self._var_name(node.id)
        return node

    def visit_Attribute(self, node: ast.Attribute) -> ast.AST:
        self.generic_visit(node)
        if isinstance(node.value, ast.Name) and node.value.id in ("self", "cls"):
            if not _DUNDER_RE.match(node.attr) and node.attr not in _KEEP_NAMES:
                node.attr = self._var_name(node.attr)
        return node

    def _anonymize_args(self, args: ast.arguments) -> None:
        for collection in (args.posonlyargs, args.args, args.kwonlyargs):
            for a in collection:
                a.arg = self._var_name(a.arg)
        if args.vararg:
            args.vararg.arg = self._var_name(args.vararg.arg)
        if args.kwarg:
            args.kwarg.arg = self._var_name(args.kwarg.arg)


# ---------------------------------------------------------------------------
# Plagiarism Detector Class
# ---------------------------------------------------------------------------
class PlagiarismDetector:
    """
    Detects code plagiarism using semantic similarity when available,
    falling back to a stopword-filtered, identifier-anonymized shingle
    Jaccard similarity otherwise.
    """

    SHINGLE_SIZE = 3          # consecutive tokens per shingle (effective for small & large files)
    SIMILARITY_STORE_FLOOR = 0.15
    CHUNK_SIZE_CHARS = 500

    def __init__(self) -> None:
        self.threshold: float = 0.75  # 75% similarity = flagged

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def detect(self, current_code: str, existing_projects: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Compare current code with a list of existing project code snippets.

        Args:
            current_code: Code to check.
            existing_projects: List of dicts with 'id', 'code', 'student_name'.

        Returns:
            Dictionary with originality score, risk level, matches,
            matching logic sections, and transparency metadata.
        """
        if not current_code or not current_code.strip():
            return self._empty_response("Current code is empty.")

        norm_current = self._normalize_code(current_code)
        if not norm_current.strip():
            return self._empty_response("Current code has no comparable content after normalization.")

        model = _get_sbert()
        detection_method = "semantic" if model is not None else "structural_heuristic"

        candidates: List[Tuple[Any, str, str]] = []  # (id, code, student_name)
        skipped = 0
        for proj in existing_projects:
            pcode = proj.get("code", "")
            if not pcode or not pcode.strip():
                skipped += 1
                continue
            candidates.append((proj.get("id"), pcode, proj.get("student_name", "Unknown")))

        if not candidates:
            result = self._empty_response(
                "No comparable projects were available (all candidates were empty or unreadable)."
            )
            result["detection_method"] = detection_method
            result["projects_compared"] = 0
            result["projects_skipped"] = skipped
            return result

        if model is not None:
            similarities = self._compare_semantic(model, norm_current, candidates)
        else:
            similarities = self._compare_structural(norm_current, candidates)

        similar_projects: List[Dict[str, Any]] = []
        similar_sections: List[Dict[str, Any]] = []
        max_similarity = 0.0

        for (pid, _code, pname), sim in zip(candidates, similarities):
            if sim >= self.SIMILARITY_STORE_FLOOR:
                similar_projects.append({
                    "id": pid,
                    "project_id": pid,
                    "student_name": pname,
                    "similarity": float(round(sim, 4)),
                })
            max_similarity = max(max_similarity, sim)

        similar_projects.sort(key=lambda x: x["similarity"], reverse=True)

        # Generate UI-friendly similar_sections for frontend visualization
        for idx, p in enumerate(similar_projects[:5]):
            sim_pct = round(p["similarity"] * 100.0, 1)
            similar_sections.append({
                "partition": idx + 1,
                "similarity_score": sim_pct,
                "matched_project_id": p["project_id"],
                "matched_student": p["student_name"],
                "description": f"Significant structural correlation ({sim_pct}%) with submission by {p['student_name']} (ID: {p['project_id']})."
            })

        originality_score = max(0.0, float(100.0 - (max_similarity * 100.0)))
        risk_level = self._get_risk_level(max_similarity)

        return {
            "originality_score": float(round(originality_score, 2)),
            "flagged": max_similarity >= self.threshold,
            "max_similarity_percent": float(round(max_similarity * 100.0, 2)),
            "similar_projects": similar_projects[:5],
            "similar_sections": similar_sections,
            "risk_level": risk_level,
            "detection_method": detection_method,
            "projects_compared": len(candidates),
            "projects_skipped": skipped,
        }

    def detect_with_database(self, current_code: str, db: Session, current_project_id: int) -> Dict[str, Any]:
        """Detect plagiarism by fetching existing projects from the database."""
        projects_query = db.query(Project).filter(Project.id != current_project_id).all()

        existing_projects = []
        unreadable = 0
        for p in projects_query:
            code_content = ""
            if p.code_file_path:
                try:
                    with open(p.code_file_path, "r", encoding="utf-8", errors="ignore") as f:
                        code_content = f.read()
                except Exception as exc:
                    unreadable += 1
                    logger.warning("Could not read project code file %s: %s", p.code_file_path, exc)

            if code_content:
                student_name = p.owner.full_name if p.owner else f"User {p.student_id}"
                existing_projects.append({
                    "id": p.id,
                    "code": code_content,
                    "student_name": student_name,
                })

        if projects_query and not existing_projects:
            logger.error(
                "Plagiarism check for project %s: ALL %d candidate project(s) failed to load "
                "(%d unreadable). Reporting inconclusive rather than a false 'fully original' result.",
                current_project_id, len(projects_query), unreadable,
            )
            result = self._empty_response(
                f"Could not read any of the {len(projects_query)} candidate project files "
                "for comparison — result is inconclusive, not a confirmed originality finding."
            )
            result["detection_method"] = "none"
            result["projects_compared"] = 0
            result["projects_skipped"] = unreadable
            return result

        result = self.detect(current_code, existing_projects)
        result["projects_skipped"] = result.get("projects_skipped", 0) + unreadable
        return result

    def generate_detailed_report(self, results: Dict[str, Any]) -> str:
        """Generate a human-readable text report from the JSON results."""
        score = results.get("originality_score", 100.0)
        risk = results.get("risk_level", "MINIMAL")
        sim_pct = results.get("max_similarity_percent", 0.0)
        flagged = results.get("flagged", False)
        similar_projs = results.get("similar_projects", [])
        method = results.get("detection_method", "unknown")
        compared = results.get("projects_compared")
        skipped = results.get("projects_skipped")

        lines = [
            "==================================",
            "   PLAGIARISM DETECTION REPORT    ",
            "==================================",
            f"Detection Method:   {method}",
        ]
        if compared is not None:
            lines.append(f"Projects Compared:  {compared} (skipped/unreadable: {skipped or 0})")
        lines += [
            f"Originality Score:  {score:.2f} / 100",
            f"Highest Similarity: {sim_pct:.2f}%",
            f"Risk Level:         {risk}",
            f"Flagged for Review: {'YES' if flagged else 'NO'}",
            "----------------------------------",
        ]

        if results.get("error") and not similar_projs and compared == 0:
            lines.append(f"⚠ INCONCLUSIVE: {results['error']}")
            lines.append("Recommendation: Investigate why no comparison data was available before trusting this result.")
        elif not similar_projs:
            lines.append("No similar projects found.")
            lines.append("Recommendation: Code is original. Proceed with evaluation.")
        else:
            lines.append("Top Similar Projects:")
            for p in similar_projs:
                pid = p.get("project_id", p.get("id", "N/A"))
                pname = p.get("student_name", "Unknown")
                psim = p.get("similarity", 0.0)
                lines.append(f" - {pname} (ID: {pid}) -> {psim * 100:.1f}%")

            lines.append("----------------------------------")
            lines.append("Recommendations:")
            if risk == "HIGH":
                lines.append(" - CRITICAL: High likelihood of copy/pasting. Manual review required.")
            elif risk == "MEDIUM":
                lines.append(" - WARNING: Suspicious structural overlap found. Validate shared logic.")
            elif risk == "LOW":
                lines.append(" - NOTE: Mild similarity. Likely due to shared boilerplate/templates.")
            else:
                lines.append(" - Code appears original. Minor overlaps are acceptable patterns.")

        return "\n".join(lines)

    # ------------------------------------------------------------------
    # Comparison & Fallback Core
    # ------------------------------------------------------------------
    def _compare_code(
        self,
        model: Any,
        current_chunks: List[str],
        emb_current: Any,
        proj_code: str,
        proj_id: Any
    ) -> float:
        """
        Backward-compatible single-pair comparator.
        If ML is enabled with embeddings, uses Sentence-BERT cosine similarity.
        Otherwise falls back to token and structural overlap checking.
        """
        norm_proj = self._normalize_code(proj_code)
        chunks_proj = self._chunk_code(norm_proj, chunk_size=500)
        if not chunks_proj:
            return 0.0

        if model is not None and emb_current is not None:
            try:
                from sentence_transformers import util
                emb_proj = self._get_or_generate_embedding(proj_id, chunks_proj, model)
                if emb_proj is None:
                    return 0.0
                cosine_scores = util.cos_sim(emb_current, emb_proj)
                max_vals, _ = cosine_scores.max(dim=1)
                overall_sim = float(max_vals.mean().item())
                return max(0.0, min(1.0, overall_sim))
            except Exception as exc:
                logger.error("Error in semantic _compare_code: %s", exc)

        # Fallback heuristic: token overlap & shingles
        current_str = " ".join(current_chunks)
        current_tokens = set(re.findall(r"\b\w+\b", current_str.lower()))
        proj_tokens = set(re.findall(r"\b\w+\b", norm_proj))
        if not current_tokens or not proj_tokens:
            return 0.0
        jaccard = len(current_tokens & proj_tokens) / len(current_tokens | proj_tokens)
        return float(jaccard)

    def _get_or_generate_embedding(self, project_id: Any, chunks: List[str], model: Any) -> Any:
        """Base method for generating embeddings; overridden in caching subclass."""
        try:
            return model.encode(chunks, convert_to_tensor=True)
        except Exception as exc:
            logger.error("Embedding generation failed: %s", exc)
            return None

    def _compare_semantic(
        self, model: Any, norm_current: str, candidates: List[Tuple[Any, str, str]]
    ) -> List[float]:
        try:
            from sentence_transformers import util
        except Exception:
            return self._compare_structural(norm_current, candidates)

        current_chunks = self._chunk_code(norm_current)
        if not current_chunks:
            return [0.0] * len(candidates)

        try:
            emb_current = model.encode(current_chunks, convert_to_tensor=True)
        except Exception as exc:
            logger.error("Current-code embedding failed: %s", exc)
            return self._compare_structural(norm_current, candidates)

        norm_candidates = [self._normalize_code(code) for _, code, _ in candidates]
        chunk_lists = [self._chunk_code(nc) for nc in norm_candidates]

        flat_chunks: List[str] = []
        spans: List[Tuple[int, int]] = []
        cursor = 0
        for chunks in chunk_lists:
            spans.append((cursor, cursor + len(chunks)))
            flat_chunks.extend(chunks)
            cursor += len(chunks)

        if not flat_chunks:
            return [0.0] * len(candidates)

        try:
            flat_embeddings = model.encode(flat_chunks, convert_to_tensor=True)
        except Exception as exc:
            logger.error("Candidate embedding batch failed: %s", exc)
            return self._compare_structural(norm_current, candidates)

        results: List[float] = []
        for start, end in spans:
            if start == end:
                results.append(0.0)
                continue
            emb_proj = flat_embeddings[start:end]
            cosine_scores = util.cos_sim(emb_current, emb_proj)
            max_vals, _ = cosine_scores.max(dim=1)
            overall_sim = float(max_vals.mean().item())
            results.append(max(0.0, min(1.0, overall_sim)))
        return results

    def _compare_structural(
        self, norm_current: str, candidates: List[Tuple[Any, str, str]]
    ) -> List[float]:
        """
        Compares structural overlap using both normalized shingles and
        identifier-anonymized shingles. Taking max(sim_norm, sim_anon) ensures
        that both verbatim copies and copies with renamed identifiers are caught.
        """
        current_shingles = self._shingles(norm_current)
        current_anon = self._anonymize_code(norm_current)
        current_anon_shingles = self._shingles(current_anon)

        results: List[float] = []
        for _pid, code, _name in candidates:
            norm_proj = self._normalize_code(code)
            if norm_current and norm_current == norm_proj:
                results.append(1.0)
                continue

            proj_anon = self._anonymize_code(norm_proj)
            if current_anon and current_anon == proj_anon:
                results.append(1.0)
                continue

            proj_shingles = self._shingles(norm_proj)
            sim_norm = self._jaccard(current_shingles, proj_shingles)

            proj_anon_shingles = self._shingles(proj_anon)
            sim_anon = self._jaccard(current_anon_shingles, proj_anon_shingles)

            results.append(max(sim_norm, sim_anon))
        return results

    @staticmethod
    def _jaccard(a: set, b: set) -> float:
        if not a or not b:
            return 0.0
        intersection = len(a & b)
        union = len(a | b)
        return intersection / union if union else 0.0

    def _shingles(self, normalized_code: str, k: Optional[int] = None) -> set:
        """
        Tokenize and build overlapping k-token windows.
        Captures local syntactic and statement sequence ordering.
        """
        k = k or self.SHINGLE_SIZE
        all_tokens = re.findall(r"\b\w+\b", normalized_code)
        tokens = [
            t for t in all_tokens
            if t not in _KEEP_NAMES
        ]
        if not tokens:
            tokens = all_tokens
        if not tokens:
            return set()
        if len(tokens) < k:
            return {" ".join(tokens)}
        return {
            " ".join(tokens[i:i + k])
            for i in range(len(tokens) - k + 1)
        }

    # ------------------------------------------------------------------
    # Normalization & Anonymization
    # ------------------------------------------------------------------
    def _normalize_code(self, code: str) -> str:
        """
        Normalize code by removing docstrings, comments, extra whitespace,
        and standardizing formatting via AST unparse while preserving code structure.
        """
        try:
            tree = ast.parse(code)
            tree = _StringLiteralMasker().visit(tree)
            ast.fix_missing_locations(tree)
            if hasattr(ast, "unparse"):
                clean = ast.unparse(tree)
                clean = re.sub(r'["\'].*?["\']', '""', clean)
                return clean.lower()
        except Exception:
            pass

        # Fallback for non-Python or syntax-invalid snippets
        code = re.sub(r'(?m)^\s*#.*$', '', code)
        code = re.sub(r'(?<!["\'])#[^\n]*$', '', code, flags=re.MULTILINE)
        code = re.sub(r'(?m)^\s*//.*$', '', code)
        code = re.sub(r'\s+', ' ', code)
        return code.strip().lower()

    def _anonymize_code(self, code: str) -> str:
        """
        Anonymizes locally defined variables, functions, and classes to positional
        placeholders (v0, v1, fn0, cls0) so that renamed-variable plagiarism collapses.
        """
        try:
            tree = ast.parse(code)
            tree = _StringLiteralMasker().visit(tree)
            tree = _IdentifierAnonymizer().visit(tree)
            ast.fix_missing_locations(tree)
            if hasattr(ast, "unparse"):
                clean = ast.unparse(tree)
                clean = re.sub(r'["\'].*?["\']', '""', clean)
                return clean.lower()
        except Exception:
            pass
        return self._normalize_code(code)

    def _chunk_code(self, code: str, chunk_size: Optional[int] = None) -> List[str]:
        """
        Split code into smaller pieces to prevent exceeding embedding model token limits.
        Uses character count as proxy for tokens.
        """
        chunk_size = chunk_size or self.CHUNK_SIZE_CHARS
        if not code:
            return []
        return [code[i:i + chunk_size] for i in range(0, len(code), chunk_size)]

    def _get_risk_level(self, similarity: float) -> str:
        """Map similarity score to categorical risk level."""
        if similarity >= 0.90:
            return "HIGH"
        elif similarity >= 0.75:
            return "MEDIUM"
        elif similarity >= 0.60:
            return "LOW"
        else:
            return "MINIMAL"

    def _empty_response(self, reason: str) -> Dict[str, Any]:
        """Generate a default clean response when code is empty or comparison is unavailable."""
        return {
            "originality_score": 100.0,
            "flagged": False,
            "max_similarity_percent": 0.0,
            "similar_projects": [],
            "similar_sections": [],
            "risk_level": "MINIMAL",
            "error": reason,
        }


# ---------------------------------------------------------------------------
# Caching Implementation
# ---------------------------------------------------------------------------
class PlagiarismDetectorWithCache(PlagiarismDetector):
    """
    Inherits from PlagiarismDetector but caches generated embeddings in
    memory to accelerate repeated evaluations.
    """

    MAX_CACHE_ENTRIES = 512

    def __init__(self) -> None:
        super().__init__()
        self.embedding_cache: Dict[Any, Any] = {}
        self._embedding_cache: "OrderedDict[Tuple[Any, str], Any]" = OrderedDict()
        self._cache_lock = threading.Lock()

    def _get_or_generate_embedding(self, project_id: Any, chunks: List[str], model: Any) -> Any:
        """Cache-aware embedding lookup / generation."""
        if project_id in self.embedding_cache:
            return self.embedding_cache[project_id]

        try:
            emb = model.encode(chunks, convert_to_tensor=True)
            self.embedding_cache[project_id] = emb
            return emb
        except Exception as exc:
            logger.error("Cached embedding failed for project %s: %s", project_id, exc)
            return None

    def _cached_embedding(self, project_id: Any, normalized_code: str, chunks: List[str], model: Any) -> Any:
        content_hash = hashlib.sha256(normalized_code.encode("utf-8", errors="ignore")).hexdigest()
        key = (project_id, content_hash)

        with self._cache_lock:
            cached = self._embedding_cache.get(key)
            if cached is not None:
                self._embedding_cache.move_to_end(key)
                return cached

        try:
            emb = model.encode(chunks, convert_to_tensor=True)
        except Exception as exc:
            logger.error("Cached embedding failed for project %s: %s", project_id, exc)
            return None

        with self._cache_lock:
            self._embedding_cache[key] = emb
            self._embedding_cache.move_to_end(key)
            while len(self._embedding_cache) > self.MAX_CACHE_ENTRIES:
                self._embedding_cache.popitem(last=False)
        return emb

    def _compare_semantic(
        self, model: Any, norm_current: str, candidates: List[Tuple[Any, str, str]]
    ) -> List[float]:
        try:
            from sentence_transformers import util
        except Exception:
            return self._compare_structural(norm_current, candidates)

        current_chunks = self._chunk_code(norm_current)
        if not current_chunks:
            return [0.0] * len(candidates)

        try:
            emb_current = model.encode(current_chunks, convert_to_tensor=True)
        except Exception as exc:
            logger.error("Current-code embedding failed: %s", exc)
            return self._compare_structural(norm_current, candidates)

        results: List[float] = []
        for pid, code, _name in candidates:
            norm_proj = self._normalize_code(code)
            chunks_proj = self._chunk_code(norm_proj)
            if not chunks_proj:
                results.append(0.0)
                continue
            emb_proj = self._cached_embedding(pid, norm_proj, chunks_proj, model)
            if emb_proj is None:
                results.append(0.0)
                continue
            cosine_scores = util.cos_sim(emb_current, emb_proj)
            max_vals, _ = cosine_scores.max(dim=1)
            overall_sim = float(max_vals.mean().item())
            results.append(max(0.0, min(1.0, overall_sim)))
        return results