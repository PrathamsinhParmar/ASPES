"""
AI Engine - Report-Code Alignment Verifier

Analyzes alignment between project documentation (report) and actual source code.
Uses AST for code parsing, NLP for report analysis, and Sentence-BERT for
semantic similarity.
"""
import ast
import logging
import re
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lazy-loaded singletons
# ---------------------------------------------------------------------------
_sbert_model = None
_spacy_nlp = None


def _get_sbert():
    global _sbert_model
    if _sbert_model is not None:
        return _sbert_model
    try:
        from sentence_transformers import SentenceTransformer
        _sbert_model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("SBERT loaded for alignment.")
    except Exception as e:
        logger.warning(f"SBERT unavailable: {e}")
    return _sbert_model


def _get_spacy():
    global _spacy_nlp
    if _spacy_nlp is not None:
        return _spacy_nlp
    try:
        import spacy
        _spacy_nlp = spacy.load("en_core_web_sm")
        logger.info("spaCy model loaded.")
    except Exception as e:
        logger.warning(f"spaCy unavailable ({e}). Falling back to regex.")
    return _spacy_nlp


# ---------------------------------------------------------------------------
# Known tech keyword → import alias mapping
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
    "postgresql": ["psycopg2", "asyncpg"],
    "mongodb": ["pymongo", "motor"],
    "jwt": ["jose", "jwt"],
    "bcrypt": ["bcrypt", "passlib"],
    "selenium": ["selenium"],
    "beautifulsoup": ["bs4", "beautifulsoup"],
    "requests": ["requests", "httpx", "aiohttp"],
    "openai": ["openai"],
    "transformers": ["transformers"],
}


class ReportCodeAligner:
    """
    Analyzes alignment between project documentation and actual code.
    Uses NLP for report analysis, AST for code parsing, and
    Sentence-BERT for semantic similarity.
    """

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

        Args:
            report_text: Full text of the project report.
            code_content: Source code as a single concatenated string.
            file_paths: Optional list of individual file paths to analyze.

        Returns:
            Alignment score, level, detailed breakdown, and mismatch lists.
        """
        if not report_text.strip() or not code_content.strip():
            return self._empty_response("Report or code content missing")

        try:
            report_features = self._extract_report_features(report_text)
            code_features = self._extract_code_features(code_content, file_paths)

            feature_result = self._check_feature_alignment(report_features, code_features)
            tech_result = self._check_technology_stack(report_text, code_content)
            arch_result = self._check_architecture_match(report_text, code_features)
            semantic_result = self._calculate_semantic_similarity(report_text, code_content)
            completeness_result = self._check_documentation_completeness(report_features, code_features)

            # Weighted aggregate score (all sub-scores are 0-1)
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
                "missing_features": self._find_missing_features(report_features, code_features),
                "undocumented_features": self._find_undocumented_features(report_features, code_features),
            }

        except Exception as e:
            logger.error(f"Alignment analysis failed: {e}")
            return self._empty_response(str(e))

    # ------------------------------------------------------------------
    # Feature Extraction - Report Side
    # ------------------------------------------------------------------
    def _extract_report_features(self, report_text: str) -> Dict[str, List[str]]:
        """
        Extract features, functions, technologies, algorithms, and key
        components from the report using spaCy if available, else regex.
        """
        mentioned_technologies = self._extract_tech_mentions(report_text)

        nlp = _get_spacy()
        mentioned_features: List[str] = []
        mentioned_functions: List[str] = []
        mentioned_algorithms: List[str] = []
        key_components: List[str] = []

        if nlp:
            doc = nlp(report_text)
            # Function-like names (camelCase or snake_case adjacent to verbs)
            for token in doc:
                if token.like_url or token.is_punct:
                    continue
                if "_" in token.text or (token.text[0].islower() and any(c.isupper() for c in token.text[1:])):
                    mentioned_functions.append(token.text)
                if token.pos_ == "NOUN" and token.dep_ in {"nsubj", "dobj", "attr"}:
                    mentioned_features.append(token.lemma_)

            # Named entities as key components
            key_components = list({
                ent.text for ent in doc.ents
                if ent.label_ in {"ORG", "PRODUCT", "GPE", "WORK_OF_ART"}
            })
        else:
            # Regex fallback: snake_case identifiers and CamelCase words
            mentioned_functions = re.findall(r"\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b", report_text)
            mentioned_features = re.findall(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b", report_text)

        # Algorithm keywords
        algo_keywords = [
            "algorithm", "sorting", "searching", "binary search", "neural network",
            "machine learning", "deep learning", "regression", "classification",
            "clustering", "recommendation", "encryption", "hashing"
        ]
        mentioned_algorithms = [
            kw for kw in algo_keywords if kw.lower() in report_text.lower()
        ]

        return {
            "mentioned_features": list(set(mentioned_features))[:30],
            "mentioned_functions": list(set(mentioned_functions))[:30],
            "mentioned_technologies": mentioned_technologies,
            "mentioned_algorithms": mentioned_algorithms,
            "key_components": key_components[:20],
        }

    def _extract_tech_mentions(self, text: str) -> List[str]:
        """Detect technology names in text using known-tech dictionary."""
        lower = text.lower()
        found = []
        for tech, aliases in TECH_PATTERNS.items():
            if tech in lower or any(alias in lower for alias in aliases):
                found.append(tech)
        return found

    # ------------------------------------------------------------------
    # Feature Extraction - Code Side
    # ------------------------------------------------------------------
    def _extract_code_features(
        self, code_content: str, file_paths: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Extract functions, classes, imports, and technologies from Python
        source code via AST. Falls back to regex for non-Python content.
        """
        # If individual files provided, concatenate them
        if file_paths:
            extra_code = []
            for fp in file_paths:
                try:
                    with open(fp, "r", encoding="utf-8", errors="ignore") as f:
                        extra_code.append(f.read())
                except Exception:
                    pass
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

        except SyntaxError:
            # Regex fallback for non-Python or malformed code
            functions = [
                {"name": m, "args": [], "docstring": ""}
                for m in re.findall(r"def (\w+)\s*\(", code_content)
            ]
            classes = [
                {"name": m, "methods": [], "docstring": ""}
                for m in re.findall(r"class (\w+)", code_content)
            ]
            imports = re.findall(r"import (\w+)", code_content)

        # Map imports to known technologies
        technologies = [
            tech for tech, aliases in TECH_PATTERNS.items()
            if any(alias in imports for alias in aliases)
        ]

        return {
            "functions": functions,
            "classes": classes,
            "imports": list(set(imports)),
            "technologies": technologies,
            "file_structure": file_paths or [],
        }

    # ------------------------------------------------------------------
    # Alignment Checks
    # ------------------------------------------------------------------
    def _check_feature_alignment(
        self, report_features: Dict, code_features: Dict
    ) -> Dict[str, Any]:
        """
        Cross-reference function names mentioned in the report against
        actual code definitions. Uses substring fuzzy matching.
        """
        mentioned = {f.lower() for f in report_features.get("mentioned_functions", [])}
        actual = {f["name"].lower() for f in code_features.get("functions", [])}

        matched: List[str] = []
        unmatched: List[str] = []

        for name in mentioned:
            # Exact or contains match
            if name in actual or any(name in a or a in name for a in actual):
                matched.append(name)
            else:
                unmatched.append(name)

        total = len(mentioned) or 1
        score = len(matched) / total

        return {
            "score": round(score, 4),
            "matched_features": matched,
            "unmatched_features": unmatched,
            "match_rate": f"{len(matched)}/{total}",
        }

    def _check_technology_stack(
        self, report_text: str, code_content: str
    ) -> Dict[str, Any]:
        """
        Verify that technologies mentioned in the report are actually used
        in the code (via import statements).
        """
        mentioned = self._extract_tech_mentions(report_text)
        code_imports_lower = code_content.lower()

        verified: List[str] = []
        unverified: List[str] = []

        for tech in mentioned:
            aliases = TECH_PATTERNS.get(tech, [tech])
            if any(alias in code_imports_lower for alias in aliases):
                verified.append(tech)
            else:
                unverified.append(tech)

        total = len(mentioned) or 1
        score = len(verified) / total

        return {
            "score": round(score, 4),
            "mentioned_technologies": mentioned,
            "verified_technologies": verified,
            "unverified_technologies": unverified,
        }

    def _check_architecture_match(
        self, report_text: str, code_features: Dict
    ) -> Dict[str, Any]:
        """
        Check if described architectural patterns are reflected in code.
        """
        findings: List[str] = []
        score_parts: List[float] = []
        lower_report = report_text.lower()
        class_names = {c["name"].lower() for c in code_features.get("classes", [])}
        func_names = {f["name"].lower() for f in code_features.get("functions", [])}

        # MVC / MVT
        if any(kw in lower_report for kw in ["mvc", "model-view", "mvt"]):
            has_model = any("model" in n for n in class_names | func_names)
            has_view = any("view" in n for n in class_names | func_names)
            if has_model and has_view:
                findings.append("MVC pattern detected in code — matches report.")
                score_parts.append(1.0)
            else:
                findings.append("MVC mentioned in report but not clearly reflected in code.")
                score_parts.append(0.4)

        # REST API / FastAPI / endpoint
        if any(kw in lower_report for kw in ["api", "rest", "endpoint", "fastapi"]):
            has_router = any("router" in n or "endpoint" in n or "route" in n for n in func_names | class_names)
            if has_router:
                findings.append("API/router pattern verified in code.")
                score_parts.append(1.0)
            else:
                score_parts.append(0.5)

        # Database layer
        if any(kw in lower_report for kw in ["database", "sql", "orm", "model"]):
            has_db = any(kw in n for kw in ["db", "model", "session", "engine"] for n in func_names | class_names)
            if has_db:
                findings.append("Database layer present in code — matches report.")
                score_parts.append(1.0)
            else:
                score_parts.append(0.5)

        score = sum(score_parts) / len(score_parts) if score_parts else 0.7

        return {
            "score": round(score, 4),
            "findings": findings if findings else ["No specific architecture patterns detected"],
        }

    def _calculate_semantic_similarity(
        self, report_text: str, code_content: str
    ) -> Dict[str, Any]:
        """
        Compute cosine similarity between report text embeddings and
        the combined docstrings/comments extracted from code.
        Falls back to keyword overlap if SBERT unavailable.
        """
        # Extract code prose: docstrings + inline comments
        code_prose_parts: List[str] = []
        _DOCSTRING_NODES = (ast.Module, ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)
        try:
            tree = ast.parse(code_content)
            for node in ast.walk(tree):
                if isinstance(node, _DOCSTRING_NODES):
                    ds = ast.get_docstring(node)
                    if ds:
                        code_prose_parts.append(ds)
        except SyntaxError:
            pass
        # Also grab inline comments via regex
        code_prose_parts += re.findall(r"#\s*(.+)", code_content)

        code_prose = " ".join(code_prose_parts).strip()
        if not code_prose:
            code_prose = code_content[:2000]  # Use raw code as fallback

        model = _get_sbert()
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
            except Exception as e:
                logger.warning(f"SBERT similarity failed: {e}")
                similarity = self._keyword_overlap(report_text, code_prose)
        else:
            similarity = self._keyword_overlap(report_text, code_prose)

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
        }

    def _keyword_overlap(self, text_a: str, text_b: str) -> float:
        """Simple Jaccard token overlap as SBERT fallback."""
        a_tokens = set(re.findall(r"\b[a-z]{4,}\b", text_a.lower()))
        b_tokens = set(re.findall(r"\b[a-z]{4,}\b", text_b.lower()))
        if not a_tokens or not b_tokens:
            return 0.5
        intersection = a_tokens & b_tokens
        union = a_tokens | b_tokens
        return len(intersection) / len(union)

    def _check_documentation_completeness(
        self, report_features: Dict, code_features: Dict
    ) -> Dict[str, Any]:
        """
        Check what fraction of code components (functions + classes)
        are referenced in the report.
        """
        report_text_lower = " ".join(
            report_features.get("mentioned_features", [])
            + report_features.get("mentioned_functions", [])
            + report_features.get("key_components", [])
        ).lower()

        all_code_names = (
            [f["name"].lower() for f in code_features.get("functions", [])]
            + [c["name"].lower() for c in code_features.get("classes", [])]
        )
        total = len(all_code_names) or 1
        documented = sum(1 for name in all_code_names if name in report_text_lower or
                         any(name in word or word in name for word in report_text_lower.split()))

        coverage = documented / total

        return {
            "score": round(coverage, 4),
            "documented_components": documented,
            "total_components": total,
            "coverage_percentage": round(coverage * 100, 2),
        }

    # ------------------------------------------------------------------
    # Mismatch Helpers
    # ------------------------------------------------------------------
    def _identify_mismatches(
        self, report_features: Dict, code_features: Dict
    ) -> List[str]:
        """Return human-readable mismatch descriptions."""
        mismatches: List[str] = []

        # Tech mismatches
        report_tech = set(report_features.get("mentioned_technologies", []))
        code_tech = set(code_features.get("technologies", []))
        for tech in report_tech - code_tech:
            mismatches.append(f"Technology '{tech}' mentioned in report but not found in code imports.")
        for tech in code_tech - report_tech:
            mismatches.append(f"Technology '{tech}' used in code but not mentioned in report.")

        return mismatches

    def _find_missing_features(
        self, report_features: Dict, code_features: Dict
    ) -> List[str]:
        """Features mentioned in report but absent from code."""
        mentioned_fns = {f.lower() for f in report_features.get("mentioned_functions", [])}
        code_fns = {f["name"].lower() for f in code_features.get("functions", [])}
        code_classes = {c["name"].lower() for c in code_features.get("classes", [])}
        all_code_names = code_fns | code_classes

        return [
            name for name in mentioned_fns
            if not any(name in a or a in name for a in all_code_names)
        ]

    def _find_undocumented_features(
        self, report_features: Dict, code_features: Dict
    ) -> List[str]:
        """Functions/classes in code not mentioned anywhere in report."""
        report_text = " ".join(
            report_features.get("mentioned_features", [])
            + report_features.get("mentioned_functions", [])
            + report_features.get("key_components", [])
        ).lower()

        undocumented: List[str] = []
        for fn in code_features.get("functions", []):
            name = fn["name"].lower()
            if name.startswith("_"):
                continue  # Skip private/internal helpers
            if name not in report_text:
                undocumented.append(fn["name"])

        return undocumented[:20]  # Cap list length

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
