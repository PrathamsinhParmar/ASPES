"""
AI Engine - Report-Code Alignment Verifier (v2 - hardened)

Analyzes alignment between project documentation (report) and actual source code.
Uses AST for code parsing, lightweight NLP for report analysis, and
Sentence-BERT (when available) for semantic similarity.

WHY THE ORIGINAL VERSION ALWAYS SCORED NEAR ZERO
--------------------------------------------------
The dominant weighted components (feature alignment 0.30, completeness 0.10,
and frequently technology 0.25) all depended on regex-extracting snake_case-
looking tokens directly from the *report's prose text* — but real students
describe functionality in plain English ("lets members borrow a book"), they
don't type `borrow_book` in a paragraph. That extraction matches almost
nothing in genuine writing, so those components silently collapsed to 0.0
for essentially any realistically-written report, and the semantic-
similarity fallback (weight 0.20) used a plain word-Jaccard with no stemming,
which is far too strict when comparing a paragraph of prose against a single
terse docstring.

This version flips the matching direction: instead of hoping the report
contains literal code identifiers, it decomposes each code function/class
name into its constituent words (`borrow_book` -> {"borrow", "book"}) and
checks whether those words actually appear in the report text. This is how
a human grader actually checks alignment, and it requires no NLP model to
work well.
"""

from __future__ import annotations

import ast
import logging
import re
import threading
from typing import Any, Dict, List, Optional, Set, Tuple

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lazy-loaded singletons, with a failure sentinel distinct from "not tried yet"
# ---------------------------------------------------------------------------
_sbert_model: Any = None
_sbert_load_attempted = False
_sbert_lock = threading.Lock()

_spacy_nlp: Any = None
_spacy_load_attempted = False
_spacy_lock = threading.Lock()


def _get_sbert() -> Any:
    global _sbert_model, _sbert_load_attempted
    if _sbert_load_attempted:
        return _sbert_model
    with _sbert_lock:
        if _sbert_load_attempted:
            return _sbert_model
        try:
            from sentence_transformers import SentenceTransformer
            _sbert_model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("SBERT loaded for alignment.")
        except Exception as exc:
            logger.warning("SBERT unavailable (%s). Using structural fallback for this process's lifetime.", exc)
            _sbert_model = None
        finally:
            _sbert_load_attempted = True
    return _sbert_model


def _get_spacy() -> Any:
    global _spacy_nlp, _spacy_load_attempted
    if _spacy_load_attempted:
        return _spacy_nlp
    with _spacy_lock:
        if _spacy_load_attempted:
            return _spacy_nlp
        try:
            import spacy
            _spacy_nlp = spacy.load("en_core_web_sm")
            logger.info("spaCy model loaded.")
        except Exception as exc:
            logger.warning("spaCy unavailable (%s). Falling back to regex.", exc)
            _spacy_nlp = None
        finally:
            _spacy_load_attempted = True
    return _spacy_nlp


def reset_nlp_caches_for_testing() -> None:
    """Test-only helper to force the lazy loaders to retry on next call."""
    global _sbert_model, _sbert_load_attempted, _spacy_nlp, _spacy_load_attempted
    _sbert_model = None
    _sbert_load_attempted = False
    _spacy_nlp = None
    _spacy_load_attempted = False


# ---------------------------------------------------------------------------
# Known tech keyword -> import alias mapping
# ---------------------------------------------------------------------------
TECH_PATTERNS: Dict[str, List[str]] = {
    "fastapi": ["fastapi"],
    "django": ["django"],
    "flask": ["flask"],
    "sqlalchemy": ["sqlalchemy"],
    "pytorch": ["torch"],
    "tensorflow": ["tensorflow", "tf"],
    "numpy": ["numpy", "np"],
    "pandas": ["pandas", "pd"],
    "scikit-learn": ["sklearn"],
    "redis": ["redis"],
    "celery": ["celery"],
    "pydantic": ["pydantic"],
    "react": ["react"],
    "postgresql": ["psycopg2", "asyncpg", "postgresql", "postgres"],
    "mongodb": ["pymongo", "motor", "mongodb"],
    "jwt": ["jose", "jwt"],
    "bcrypt": ["bcrypt", "passlib"],
    "selenium": ["selenium"],
    "beautifulsoup": ["bs4", "beautifulsoup"],
    "requests": ["requests", "httpx", "aiohttp"],
    "openai": ["openai"],
    "transformers": ["transformers"],
}

# Aliases short enough that naive substring matching produces false
# positives (e.g. "pd" inside "updated"). These are always matched with
# an explicit word-boundary regex, never plain `in` substring checks.
_SHORT_ALIASES = {a for aliases in TECH_PATTERNS.values() for a in aliases if len(a) <= 3}

_STOPWORDS = frozenset("""
a an the this that these those is are was were be been being have has had do does did
will would shall should may might must can could and or but if then else for while with
without within into onto from to of in on at by as it its their there here also very
more most such not no nor so than too s i we you he she they them his her our your
""".split())

_SUFFIXES = ("ational", "ization", "fulness", "iveness", "tional", "biliti",
             "ing", "tion", "ment", "ness", "ity", "ies", "ied", "es", "ed", "s")


def _light_stem(word: str) -> str:
    """Cheap dependency-free suffix stripping so 'creates'/'creating' and
    similar morphological variants are treated as the same token."""
    for suf in _SUFFIXES:
        if word.endswith(suf) and len(word) - len(suf) >= 3:
            return word[: -len(suf)]
    return word


def _word_contains(alias: str, haystack_lower: str) -> bool:
    """Word-boundary aware containment check. Required for short aliases
    like 'pd'/'tf'/'np' which otherwise match as substrings of ordinary
    English words ('updated', 'after', 'input')."""
    return re.search(rf"\b{re.escape(alias)}\b", haystack_lower) is not None


def _split_identifier(name: str) -> List[str]:
    """snake_case / camelCase / PascalCase -> list of lowercase words,
    e.g. 'borrow_book' -> ['borrow', 'book'], 'getUserById' -> ['get','user','by','id']."""
    name = re.sub(r"(?<!^)(?=[A-Z])", "_", name)
    parts = re.split(r"[_\d]+", name)
    return [p.lower() for p in parts if len(p) > 1]


def _identifier_coverage(name: str, report_word_stems: Set[str]) -> float:
    """
    Fraction of an identifier's constituent words (stemmed) that appear
    among the report's (stemmed) words. Stemming both sides means
    'check_overdue_loans' correctly matches a report saying 'checked' /
    'overdue', not just the exact word 'check'. This is the core fix: it
    checks for the *ideas* behind a function name in prose, rather than
    requiring the prose to contain the literal identifier or its exact
    word forms.
    """
    words = [w for w in _split_identifier(name) if w not in _STOPWORDS and len(w) > 2]
    if not words:
        return 0.0
    hits = sum(1 for w in words if _light_stem(w) in report_word_stems)
    return hits / len(words)


def _stemmed_word_set(text: str) -> Set[str]:
    # First expand snake_case / underscore-joined tokens so that e.g.
    # "csv_reader" in a JSON report is treated as two separate words
    # "csv" and "reader" rather than being ignored by the \b boundary rule.
    expanded = re.sub(r"_+", " ", text)
    return {_light_stem(w) for w in re.findall(r"\b[a-z]{3,}\b", expanded.lower()) if w not in _STOPWORDS}



class ReportCodeAligner:
    """
    Analyzes alignment between project documentation and actual code.
    Uses lightweight NLP for report analysis, AST for code parsing, and
    Sentence-BERT (when available) for semantic similarity.
    """

    MATCH_COVERAGE_THRESHOLD = 0.5  # >=50% of an identifier's words present = "documented"

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def analyze_alignment(
        self,
        report_text: str,
        code_content: str,
        file_paths: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Comprehensive alignment analysis between a project report and its code.

        Returns alignment score, level, detailed breakdown, and mismatch lists.
        """
        if not report_text.strip() or not code_content.strip():
            return self._empty_response("Report or code content missing")

        try:
            report_features = self._extract_report_features(report_text)
            code_features = self._extract_code_features(code_content, file_paths)

            coverage_map = self._build_coverage_map(report_text, code_features)

            feature_result = self._check_feature_alignment(coverage_map)
            tech_result = self._check_technology_stack(report_text, code_features)
            arch_result = self._check_architecture_match(report_text, code_features)
            semantic_result = self._calculate_semantic_similarity(report_text, code_content)
            completeness_result = self._check_documentation_completeness(coverage_map)

            overall = (
                feature_result["score"] * 0.30
                + tech_result["score"] * 0.25
                + arch_result["score"] * 0.15
                + semantic_result["score"] * 0.20
                + completeness_result["score"] * 0.10
            ) * 100

            return {
                "overall_alignment_score": round(overall, 2),
                "alignment_level": self._get_alignment_level(overall),
                "detailed_results": {
                    "feature_alignment": feature_result,
                    "technology_alignment": tech_result,
                    "architecture_alignment": arch_result,
                    "semantic_similarity": semantic_result,
                    "completeness": completeness_result,
                },
                "mismatches": self._identify_mismatches(report_features, code_features),
                "missing_features": self._find_missing_features(report_text, report_features, code_features),
                "undocumented_features": self._find_undocumented_features(coverage_map),
            }

        except Exception as exc:
            logger.error("Alignment analysis failed: %s", exc, exc_info=True)
            return self._empty_response(str(exc))

    # ------------------------------------------------------------------
    # Feature Extraction - Report Side (best-effort, informational)
    # ------------------------------------------------------------------
    def _extract_report_features(self, report_text: str) -> Dict[str, List[str]]:
        """
        Best-effort extraction of technologies, algorithms mentioned, and
        capitalized "key component" phrases. NOTE: this is intentionally
        NOT used as the basis for feature/completeness scoring anymore —
        see `_build_coverage_map` for the robust code-identifier-driven
        approach. This remains useful as informational metadata and for
        the `missing_features` heuristic.
        """
        mentioned_technologies = self._extract_tech_mentions(report_text)

        nlp = _get_spacy()
        key_components: List[str] = []

        if nlp:
            doc = nlp(report_text)
            key_components = list({
                ent.text for ent in doc.ents
                if ent.label_ in {"ORG", "PRODUCT", "GPE", "WORK_OF_ART"}
            })
        else:
            key_components = re.findall(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b", report_text)

        algo_keywords = [
            "algorithm", "sorting", "searching", "binary search", "neural network",
            "machine learning", "deep learning", "regression", "classification",
            "clustering", "recommendation", "encryption", "hashing",
        ]
        mentioned_algorithms = [kw for kw in algo_keywords if kw.lower() in report_text.lower()]

        return {
            "mentioned_technologies": mentioned_technologies,
            "mentioned_algorithms": mentioned_algorithms,
            "key_components": list(dict.fromkeys(key_components))[:20],
        }

    def _extract_tech_mentions(self, text: str) -> List[str]:
        """Detect technology names in text using the known-tech dictionary,
        with word-boundary matching for short aliases to avoid false
        positives like 'pd' inside 'updated'."""
        lower = text.lower()
        found = []
        for tech, aliases in TECH_PATTERNS.items():
            hit = False
            for alias in [tech] + aliases:
                if alias in _SHORT_ALIASES:
                    if _word_contains(alias, lower):
                        hit = True
                        break
                elif alias in lower:
                    hit = True
                    break
            if hit:
                found.append(tech)
        return found

    # ------------------------------------------------------------------
    # Feature Extraction - Code Side
    # ------------------------------------------------------------------
    def _extract_code_features(
        self, code_content: str, file_paths: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Extract functions, classes, and imports via AST, falling back
        to regex for non-Python or malformed content."""
        if file_paths:
            extra_code = []
            for fp in file_paths:
                try:
                    with open(fp, "r", encoding="utf-8", errors="ignore") as f:
                        extra_code.append(f.read())
                except Exception as exc:
                    logger.warning("Could not read file %s for alignment check: %s", fp, exc)
            if extra_code:
                code_content = code_content + "\n" + "\n".join(extra_code)

        functions: List[Dict[str, Any]] = []
        classes: List[Dict[str, Any]] = []
        imports: List[str] = []

        try:
            tree = ast.parse(code_content)
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    functions.append({
                        "name": node.name,
                        "args": [a.arg for a in node.args.args],
                        "docstring": ast.get_docstring(node) or "",
                    })
                elif isinstance(node, ast.ClassDef):
                    methods = [
                        n.name for n in ast.walk(node)
                        if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))
                    ]
                    classes.append({
                        "name": node.name,
                        "methods": methods,
                        "docstring": ast.get_docstring(node) or "",
                    })
                elif isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append(alias.name.split(".")[0])
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.append(node.module.split(".")[0])
        except (SyntaxError, ValueError, RecursionError) as exc:
            logger.info("AST parse failed (%s); using regex fallback for code feature extraction.", exc)
            functions = [
                {"name": m, "args": [], "docstring": ""}
                for m in re.findall(r"def (\w+)\s*\(", code_content)
            ]
            classes = [
                {"name": m, "methods": [], "docstring": ""}
                for m in re.findall(r"class (\w+)", code_content)
            ]
            imports = re.findall(r"import (\w+)", code_content)

        imports = list(set(imports))
        imports_lower = {imp.lower() for imp in imports}
        technologies = [
            tech for tech, aliases in TECH_PATTERNS.items()
            if any(alias.lower() in imports_lower for alias in aliases)
        ]

        return {
            "functions": functions,
            "classes": classes,
            "imports": imports,
            "technologies": technologies,
            "file_structure": file_paths or [],
        }

    # ------------------------------------------------------------------
    # Core fix: code-identifier -> report-text coverage, computed once
    # ------------------------------------------------------------------
    def _build_coverage_map(self, report_text: str, code_features: Dict) -> List[Dict[str, Any]]:
        """
        For every non-private function/class in the code, compute what
        fraction of its constituent words actually appear in the report.
        This single computation backs both `feature_alignment` (a
        threshold-based match count) and `completeness` (the continuous
        average coverage), so the two components stay consistent with
        each other while measuring complementary things.
        """
        report_word_stems = _stemmed_word_set(report_text)
        names = (
            [f["name"] for f in code_features.get("functions", []) if not f["name"].startswith("_")]
            + [c["name"] for c in code_features.get("classes", [])]
        )
        coverage_map = []
        for name in names:
            coverage = _identifier_coverage(name, report_word_stems)
            coverage_map.append({
                "name": name,
                "coverage": round(coverage, 3),
                "documented": coverage >= self.MATCH_COVERAGE_THRESHOLD,
            })
        return coverage_map

    def _check_feature_alignment(self, coverage_map: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Fraction of code functions/classes that are 'clearly' reflected
        (>=50% of their constituent words present) in the report."""
        if not coverage_map:
            return {
                "score": 1.0, "matched_features": [], "unmatched_features": [],
                "match_rate": "0/0", "note": "No named functions/classes found in code.",
            }
        matched = [c["name"] for c in coverage_map if c["documented"]]
        unmatched = [c["name"] for c in coverage_map if not c["documented"]]
        score = len(matched) / len(coverage_map)
        return {
            "score": round(score, 4),
            "matched_features": matched,
            "unmatched_features": unmatched,
            "match_rate": f"{len(matched)}/{len(coverage_map)}",
        }

    def _check_documentation_completeness(self, coverage_map: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Mean word-coverage across all code functions/classes — a more
        granular signal than the binary match used by feature_alignment,
        so a partially-described function still earns partial credit."""
        if not coverage_map:
            return {"score": 1.0, "documented_components": 0, "total_components": 0, "coverage_percentage": 100.0}
        total = len(coverage_map)
        mean_coverage = sum(c["coverage"] for c in coverage_map) / total
        documented = sum(1 for c in coverage_map if c["documented"])
        return {
            "score": round(mean_coverage, 4),
            "documented_components": documented,
            "total_components": total,
            "coverage_percentage": round(mean_coverage * 100, 2),
        }

    def _find_undocumented_features(self, coverage_map: List[Dict[str, Any]]) -> List[str]:
        return [c["name"] for c in coverage_map if not c["documented"]][:20]

    # ------------------------------------------------------------------
    # Technology stack check (uses parsed imports, not raw-text substring
    # search, and word-boundary matching for short aliases)
    # ------------------------------------------------------------------
    def _check_technology_stack(self, report_text: str, code_features: Dict) -> Dict[str, Any]:
        """Verify that technologies mentioned in the report are actually
        imported in the code, using the already-parsed import list rather
        than a raw substring search of the full code text (which can
        match aliases inside unrelated identifiers/strings)."""
        mentioned = self._extract_tech_mentions(report_text)
        code_technologies = set(code_features.get("technologies", []))

        verified = [t for t in mentioned if t in code_technologies]
        unverified = [t for t in mentioned if t not in code_technologies]

        total = len(mentioned) or 1
        score = len(verified) / total if mentioned else 1.0  # nothing claimed -> nothing to fail

        return {
            "score": round(score, 4),
            "mentioned_technologies": mentioned,
            "verified_technologies": verified,
            "unverified_technologies": unverified,
        }

    # ------------------------------------------------------------------
    # Architecture pattern check (broadened keyword coverage)
    # ------------------------------------------------------------------
    def _check_architecture_match(self, report_text: str, code_features: Dict) -> Dict[str, Any]:
        findings: List[str] = []
        score_parts: List[float] = []
        lower_report = report_text.lower()
        class_names = {c["name"].lower() for c in code_features.get("classes", [])}
        func_names = {f["name"].lower() for f in code_features.get("functions", [])}
        all_names = class_names | func_names

        if any(kw in lower_report for kw in ["mvc", "model-view", "mvt"]):
            has_model = any("model" in n for n in all_names)
            has_view = any("view" in n for n in all_names)
            if has_model and has_view:
                findings.append("MVC pattern detected in code — matches report.")
                score_parts.append(1.0)
            else:
                findings.append("MVC mentioned in report but not clearly reflected in code.")
                score_parts.append(0.4)

        if any(kw in lower_report for kw in ["api", "rest", "endpoint", "fastapi", "web service", "web application", "backend"]):
            has_router = any(kw in n for kw in ["router", "endpoint", "route", "api", "app"] for n in all_names)
            if has_router:
                findings.append("API/router pattern verified in code.")
                score_parts.append(1.0)
            else:
                findings.append("API/service architecture mentioned in report but no clear router/endpoint naming found in code.")
                score_parts.append(0.5)

        if any(kw in lower_report for kw in ["database", "sql", "orm", "record", "store", "persist"]):
            has_db = any(kw in n for kw in ["db", "model", "session", "engine", "repository", "query"] for n in all_names)
            if has_db:
                findings.append("Database layer present in code — matches report.")
                score_parts.append(1.0)
            else:
                findings.append("Persistence/database behavior described in report but not clearly named in code.")
                score_parts.append(0.5)

        score = sum(score_parts) / len(score_parts) if score_parts else 0.7
        return {
            "score": round(score, 4),
            "findings": findings if findings else ["No specific architecture patterns detected in the report to check."],
        }

    # ------------------------------------------------------------------
    # Semantic similarity (SBERT when available; stemmed overlap-
    # coefficient fallback otherwise — far more forgiving of the length
    # asymmetry between a report paragraph and a short docstring)
    # ------------------------------------------------------------------
    def _calculate_semantic_similarity(self, report_text: str, code_content: str) -> Dict[str, Any]:
        code_prose_parts: List[str] = []
        _DOCSTRING_NODES = (ast.Module, ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)
        try:
            tree = ast.parse(code_content)
            for node in ast.walk(tree):
                if isinstance(node, _DOCSTRING_NODES):
                    ds = ast.get_docstring(node)
                    if ds:
                        code_prose_parts.append(ds)
        except (SyntaxError, ValueError, RecursionError):
            pass
        code_prose_parts += re.findall(r"#\s*(.+)", code_content)

        code_prose = " ".join(code_prose_parts).strip()
        used_raw_code_fallback = False
        if not code_prose:
            code_prose = code_content[:2000]
            used_raw_code_fallback = True

        model = _get_sbert()
        method = "semantic"
        if model:
            try:
                import numpy as np
                emb_report = model.encode([report_text[:512]])[0]
                emb_code = model.encode([code_prose[:512]])[0]
                similarity = float(
                    np.dot(emb_report, emb_code)
                    / (np.linalg.norm(emb_report) * np.linalg.norm(emb_code) + 1e-8)
                )
                similarity = max(0.0, min(1.0, similarity))
            except Exception as exc:
                logger.warning("SBERT similarity failed: %s", exc)
                similarity = self._keyword_overlap(report_text, code_prose)
                method = "structural_heuristic"
        else:
            similarity = self._keyword_overlap(report_text, code_prose)
            method = "structural_heuristic"

        percentage = round(similarity * 100, 2)
        if similarity >= 0.75:
            interpretation = "Excellent — report and code are highly consistent."
        elif similarity >= 0.50:
            interpretation = "Good — major concepts align."
        elif similarity >= 0.30:
            interpretation = "Moderate — partial alignment."
        else:
            interpretation = "Low — report and code may describe different things."

        return {
            "score": round(similarity, 4),
            "similarity_percentage": percentage,
            "interpretation": interpretation,
            "method": method,
            "compared_against_raw_code": used_raw_code_fallback,  # true if no docstrings/comments existed
        }

    def _keyword_overlap(self, text_a: str, text_b: str) -> float:
        """
        Stemmed, stopword-filtered Overlap coefficient (intersection over
        the SMALLER set, not the union) rather than plain Jaccard. A full
        report paragraph vs. a one-line docstring are very different
        lengths; Jaccard's union-based denominator punishes that length
        asymmetry even when the shorter text is fully covered by the
        longer one. The overlap coefficient asks "is the smaller text's
        content contained in the larger one," which is what we actually
        want to know here.
        """
        def tokenize(t: str) -> Set[str]:
            raw = re.findall(r"\b[a-z]{3,}\b", t.lower())
            return {_light_stem(w) for w in raw if w not in _STOPWORDS}

        a_tokens, b_tokens = tokenize(text_a), tokenize(text_b)
        if not a_tokens or not b_tokens:
            return 0.5
        intersection = len(a_tokens & b_tokens)
        denom = min(len(a_tokens), len(b_tokens))
        return intersection / denom if denom else 0.5

    # ------------------------------------------------------------------
    # Mismatch / missing-feature helpers
    # ------------------------------------------------------------------
    def _identify_mismatches(self, report_features: Dict, code_features: Dict) -> List[str]:
        mismatches: List[str] = []
        report_tech = set(report_features.get("mentioned_technologies", []))
        code_tech = set(code_features.get("technologies", []))
        for tech in report_tech - code_tech:
            mismatches.append(f"Technology '{tech}' mentioned in report but not found in code imports.")
        for tech in code_tech - report_tech:
            mismatches.append(f"Technology '{tech}' used in code but not mentioned in report.")
        return mismatches

    def _find_missing_features(
        self, report_text: str, report_features: Dict, code_features: Dict
    ) -> List[str]:
        """
        Best-effort: algorithms or named components the report explicitly
        claims but that don't appear anywhere in the code's identifiers or
        imports. Deliberately scoped to the things we can reliably extract
        from prose (curated algorithm keywords, capitalized component
        names) rather than pretending to parse arbitrary function claims
        out of natural language.
        """
        code_words: Set[str] = set()
        for f in code_features.get("functions", []):
            code_words.update(_split_identifier(f["name"]))
        for c in code_features.get("classes", []):
            code_words.update(_split_identifier(c["name"]))
        code_blob = " ".join(code_words)

        missing = [
            algo for algo in report_features.get("mentioned_algorithms", [])
            if not any(word in code_blob for word in algo.lower().split())
        ]
        return missing

    # ------------------------------------------------------------------
    # Utilities
    # ------------------------------------------------------------------
    def _get_alignment_level(self, score: float) -> str:
        if score >= 80:
            return "EXCELLENT"
        elif score >= 60:
            return "GOOD"
        elif score >= 40:
            return "MODERATE"
        else:
            return "POOR"

    def _empty_response(self, reason: str) -> Dict[str, Any]:
        return {
            "overall_alignment_score": 0.0,
            "alignment_level": "POOR",
            "detailed_results": {},
            "mismatches": [],
            "missing_features": [],
            "undocumented_features": [],
            "error": reason,
        }