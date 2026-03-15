"""
AI Engine - Plagiarism Detector

Detects code plagiarism using semantic similarity (Sentence-BERT).
Includes methods for standalone analysis, database integration,
caching, and generating human-readable reports.
"""
import ast
import logging
import re
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.project import Project

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lazy-loaded singletons
# ---------------------------------------------------------------------------
_sbert_model = None

def _get_sbert():
    """Lazy-load Sentence-BERT model."""
    global _sbert_model
    if _sbert_model is not None:
        return _sbert_model
    try:
        from sentence_transformers import SentenceTransformer
        _sbert_model = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("Sentence-BERT model loaded for plagiarism detection.")
    except Exception as e:
        logger.warning(f"Sentence-BERT unavailable ({e}). Plagiarism detector will fallback to heuristics.")
        _sbert_model = None
    return _sbert_model


class PlagiarismDetector:
    """
    Detects code plagiarism using semantic similarity.
    Understands code meaning rather than just string matching.
    """

    def __init__(self):
        # We don't initialize the model here to speed up app startup.
        # It's fetched lazily inside the methods when needed.
        self.threshold: float = 0.75  # 75% similarity = flagged

    def detect(self, current_code: str, existing_projects: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Compare current code with a list of existing project code snippets.

        Args:
            current_code: Code to check.
            existing_projects: List of dicts with 'id', 'code', 'student_name'.

        Returns:
            Dictionary with originality score, risk level, and matches.
        """
        if not current_code or not current_code.strip():
            return self._empty_response("Current code is empty.")

        max_similarity = 0.0
        similar_projects: List[Dict[str, Any]] = []

        norm_current = self._normalize_code(current_code)
        chunks_current = self._chunk_code(norm_current, chunk_size=500)

        # Pre-compute current embeddings if available
        model = _get_sbert()
        if model and chunks_current:
            import torch
            try:
                emb_current = model.encode(chunks_current, convert_to_tensor=True)
            except Exception as e:
                logger.error(f"Embedding failed: {e}")
                model = None  # fallback

        for proj in existing_projects:
            pid = proj.get("id")
            pcode = proj.get("code", "")
            pname = proj.get("student_name", "Unknown")

            if not pcode.strip():
                continue

            # In base class, we just generate embeddings for comparison
            similarity = self._compare_code(
                model=model,
                current_chunks=chunks_current,
                emb_current=emb_current if model else None,
                proj_code=pcode,
                proj_id=pid
            )

            if similarity >= 0.15:  # Store anything moderately similar
                similar_projects.append({
                    "project_id": pid,
                    "student_name": pname,
                    "similarity": float(round(similarity, 4))
                })

            if similarity > max_similarity:
                max_similarity = similarity

        # Sort found matches descending
        similar_projects.sort(key=lambda x: x["similarity"], reverse=True)

        originality_score = max(0.0, float(100.0 - (max_similarity * 100.0)))
        risk_level = self._get_risk_level(max_similarity)

        return {
            "originality_score": float(round(originality_score, 2)),
            "flagged": max_similarity >= self.threshold,
            "max_similarity_percent": float(round(max_similarity * 100.0, 2)),
            "similar_projects": similar_projects[:5],  # Top 5
            "risk_level": risk_level
        }

    def detect_with_database(self, current_code: str, db: Session, current_project_id: int) -> Dict[str, Any]:
        """
        Detect plagiarism by fetching existing projects from the database.
        """
        # 1. Query all projects except current one
        projects_query = db.query(Project).filter(Project.id != current_project_id).all()

        existing_projects = []
        for p in projects_query:
            # 2. Read code files
            code_content = ""
            if p.code_file_path:
                try:
                    with open(p.code_file_path, "r", encoding="utf-8", errors="ignore") as f:
                        code_content = f.read()
                except Exception as e:
                    logger.warning(f"Could not read project code file {p.code_file_path}: {e}")

            if code_content:
                student_name = p.owner.full_name if p.owner else f"User {p.student_id}"
                existing_projects.append({
                    "id": p.id,
                    "code": code_content,
                    "student_name": student_name
                })

        # 3. Run semantic similarity detection
        return self.detect(current_code, existing_projects)

    def generate_detailed_report(self, results: Dict[str, Any]) -> str:
        """
        Generate a human-readable text report bridging the JSON results.
        """
        score = results.get("originality_score", 100.0)
        risk = results.get("risk_level", "MINIMAL")
        sim_pct = results.get("max_similarity_percent", 0.0)
        flagged = results.get("flagged", False)
        similar_projs = results.get("similar_projects", [])

        lines = [
            "==================================",
            "   PLAGIARISM DETECTION REPORT    ",
            "==================================",
            f"Originality Score:  {score:.2f} / 100",
            f"Highest Similarity: {sim_pct:.2f}%",
            f"Risk Level:         {risk}",
            f"Flagged for Review: {'YES' if flagged else 'NO'}",
            "----------------------------------",
        ]

        if not similar_projs:
            lines.append("No similar projects found.")
            lines.append("Recommendation: Code is original. Proceed with evaluation.")
        else:
            lines.append("Top Similar Projects:")
            for p in similar_projs:
                lines.append(f" - {p['student_name']} (ID: {p['project_id']}) -> {p['similarity']*100:.1f}%")

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
    # Core logic and helpers
    # ------------------------------------------------------------------
    def _compare_code(self, model: Any, current_chunks: List[str], emb_current: Any, proj_code: str, proj_id: Any) -> float:
        """
        Compare embeddings of current code against project code.
        If ML is disabled, fallback to token overlap checking.
        """
        norm_proj = self._normalize_code(proj_code)
        chunks_proj = self._chunk_code(norm_proj, chunk_size=500)
        if not chunks_proj:
            return 0.0

        if model is not None and emb_current is not None:
            # Semantic search via Sentence-BERT
            from sentence_transformers import util
            emb_proj = self._get_or_generate_embedding(proj_id, chunks_proj, model)
            if emb_proj is None:
                return 0.0

            # compute global mean similarity across best matching chunks
            cosine_scores = util.cos_sim(emb_current, emb_proj)
            # Take max similarity for each chunk in current against any chunk in proj
            max_vals, _ = cosine_scores.max(dim=1)
            # The overall similarity is the average of the best matches
            overall_sim = float(max_vals.mean().item())
            return max(0.0, min(1.0, overall_sim))
        else:
            # Fallback heuristic: Simple Jaccard word overlap
            current_tokens = set(re.findall(r"\b\w+\b", " ".join(current_chunks)))
            proj_tokens = set(re.findall(r"\b\w+\b", norm_proj))
            if not current_tokens or not proj_tokens:
                return 0.0
            intersection = current_tokens.intersection(proj_tokens)
            union = current_tokens.union(proj_tokens)
            return len(intersection) / len(union)

    def _get_or_generate_embedding(self, project_id: int, chunks: List[str], model: Any) -> Any:
        """
        Overridden in PlagiarismDetectorWithCache.
        In base class, we just generate on the fly.
        """
        try:
            return model.encode(chunks, convert_to_tensor=True)
        except Exception as e:
            logger.error(f"Embedding failed: {e}")
            return None

    def _normalize_code(self, code: str) -> str:
        """
        Normalize code by removing docstrings, inline comments, and extra spaces.
        This focuses the ML model purely on structural/semantic logic.
        """
        try:
            # Python AST parsing to strip comments/docstrings safely
            tree = ast.parse(code)
            # In Python 3.9+, ast.unparse removes comments automatically 
            # and outputs a pure standard format.
            if hasattr(ast, "unparse"):
                clean = ast.unparse(tree)
                # Remove strings as well? (Usually good to avoid text overlap flagging)
                clean = re.sub(r'["\'].*?["\']', '""', clean)
                return clean.lower()
        except Exception:
            pass

        # Fallback regex normalization if AST fails (e.g., non-Python code)
        # Remove // or # comments
        code = re.sub(r'(?m)^ *#.*\n?', '', code)
        code = re.sub(r'(?m)^ *//.*\n?', '', code)
        # Remove extra whitespace
        code = re.sub(r'\s+', ' ', code)
        return code.strip().lower()

    def _chunk_code(self, code: str, chunk_size: int = 500) -> List[str]:
        """
        Split large code into smaller pieces to prevent exceeding model token limits (usually 512).
        Uses character count as proxy for tokens.
        """
        if not code:
            return []
        chunks = []
        for i in range(0, len(code), chunk_size):
            chunks.append(code[i:i + chunk_size])
        return chunks

    def _get_risk_level(self, similarity: float) -> str:
        """Map similarity score to risk level strings."""
        if similarity >= 0.90:
            return "HIGH"
        elif similarity >= 0.75:
            return "MEDIUM"
        elif similarity >= 0.60:
            return "LOW"
        else:
            return "MINIMAL"

    def _empty_response(self, reason: str) -> Dict[str, Any]:
        return {
            "originality_score": 100.0,
            "flagged": False,
            "max_similarity_percent": 0.0,
            "similar_projects": [],
            "risk_level": "MINIMAL",
            "error": reason
        }


# ---------------------------------------------------------------------------
# Caching Implementation
# ---------------------------------------------------------------------------
class PlagiarismDetectorWithCache(PlagiarismDetector):
    """
    Inherits from PlagiarismDetector but caches generated embeddings
    in memory based on project_id to massively accelerate batched checks 
    or database scans.
    """

    def __init__(self):
        super().__init__()
        self.embedding_cache: Dict[int, Any] = {}

    def _get_or_generate_embedding(self, project_id: int, chunks: List[str], model: Any) -> Any:
        """Check cache first, generate and cache if miss."""
        if project_id in self.embedding_cache:
            return self.embedding_cache[project_id]

        try:
            emb = model.encode(chunks, convert_to_tensor=True)
            self.embedding_cache[project_id] = emb
            return emb
        except Exception as e:
            logger.error(f"Cached Embedding failed: {e}")
            return None
