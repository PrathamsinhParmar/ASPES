"""
AI Engine - Documentation Evaluator

Evaluates documentation quality using NLP techniques.
Supports: PDF, Markdown, Plain Text, DOCX.
Checks completeness, clarity, structure, and readability.
"""
import logging
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Optional NLP model (lazy-loaded singleton)
# ---------------------------------------------------------------------------
_sbert_model = None


def _get_sbert():
    """Lazy-load Sentence-BERT; returns None if unavailable."""
    global _sbert_model
    if _sbert_model is not None:
        return _sbert_model
    try:
        from sentence_transformers import SentenceTransformer
        _sbert_model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Sentence-BERT model loaded for doc evaluation.")
    except Exception as e:
        logger.warning(f"Sentence-BERT unavailable ({e}). Skipping semantic checks.")
        _sbert_model = None
    return _sbert_model


# ---------------------------------------------------------------------------
# Main Evaluator
# ---------------------------------------------------------------------------
class DocumentationEvaluator:
    """
    Evaluates documentation quality using NLP.
    Checks completeness, clarity, and structure.
    """

    REQUIRED_SECTIONS = [
        "introduction", "overview", "installation",
        "usage", "features", "requirements", "examples",
    ]

    WEIGHTS = {
        "completeness": 0.40,
        "clarity": 0.30,
        "structure": 0.30,
    }

    def evaluate(self, doc_file_path: str) -> Dict[str, Any]:
        """
        Evaluate documentation quality for a given file.

        Supports .pdf, .md, .txt, .docx formats.

        Returns:
            Dict with final_score, sub-scores, word_count,
            missing_sections, and readability_grade.
        """
        if not doc_file_path:
            return self._empty_response("No file path provided")

        content = self._extract_text(doc_file_path)
        if not content or not content.strip():
            return self._empty_response("Document is empty or could not be parsed")

        completeness = self._check_completeness(content)
        clarity = self._assess_clarity(content)
        structure = self._evaluate_structure(content)

        final_score = (
            completeness * self.WEIGHTS["completeness"]
            + clarity * self.WEIGHTS["clarity"]
            + structure * self.WEIGHTS["structure"]
        )

        return {
            "final_score": round(final_score, 2),
            "completeness": round(completeness, 2),
            "clarity": round(clarity, 2),
            "structure": round(structure, 2),
            "word_count": len(content.split()),
            "missing_sections": self._find_missing_sections(content),
            "readability_grade": self._calculate_readability_grade(content),
            "code_examples_count": self._count_code_examples(content),
            "has_visuals": self._check_for_images_diagrams(content),
            "table_of_contents": self._extract_table_of_contents(content),
        }

    # ------------------------------------------------------------------
    # Text Extraction
    # ------------------------------------------------------------------
    def _extract_text(self, file_path: str) -> str:
        """Route to the correct parser based on file extension."""
        path = Path(file_path)
        suffix = path.suffix.lower()

        try:
            if suffix == ".pdf":
                return self._extract_pdf(file_path)
            elif suffix in {".md", ".txt", ".rst"}:
                return self._extract_plain(file_path)
            elif suffix == ".docx":
                return self._extract_docx(file_path)
            else:
                # Try plain text as fallback
                return self._extract_plain(file_path)
        except Exception as e:
            logger.error(f"Failed to extract text from {file_path}: {e}")
            return ""

    def _extract_pdf(self, file_path: str) -> str:
        """Extract text from a PDF using pdfplumber → pypdf fallback."""
        text = ""
        try:
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            return text
        except Exception:
            pass

        # Fallback: pypdf
        try:
            from pypdf import PdfReader
            reader = PdfReader(file_path)
            for page in reader.pages:
                text += (page.extract_text() or "") + "\n"
            return text
        except Exception as e:
            logger.error(f"PDF extraction failed: {e}")
            return ""

    def _extract_plain(self, file_path: str) -> str:
        """Read plain text with encoding fallback."""
        for encoding in ("utf-8", "utf-16", "latin-1"):
            try:
                with open(file_path, "r", encoding=encoding) as f:
                    return f.read()
            except (UnicodeDecodeError, LookupError):
                continue
        return ""

    def _extract_docx(self, file_path: str) -> str:
        """Extract text from a .docx file using python-docx."""
        try:
            from docx import Document
            doc = Document(file_path)
            return "\n".join(para.text for para in doc.paragraphs)
        except Exception as e:
            logger.error(f"DOCX extraction failed: {e}")
            return ""

    # ------------------------------------------------------------------
    # Evaluation Methods
    # ------------------------------------------------------------------
    def _check_completeness(self, content: str) -> float:
        """
        Check if documentation contains required sections.
        Score = (found_sections / total_sections) * 100.
        """
        lower = content.lower()
        found = sum(1 for section in self.REQUIRED_SECTIONS if section in lower)
        return (found / len(self.REQUIRED_SECTIONS)) * 100

    def _assess_clarity(self, content: str) -> float:
        """
        Assess readability and clarity using sentence length heuristics.

        Optimal average sentence length: 15-20 words → 100 points.
        Too short (<10 words avg) → 60 points.
        Too long (>30 words avg) → 50 points.
        """
        # Split into sentences using punctuation
        sentences = re.split(r"[.!?]+", content)
        sentences = [s.strip() for s in sentences if s.strip()]
        if not sentences:
            return 50.0

        avg_length = sum(len(s.split()) for s in sentences) / len(sentences)

        if 15 <= avg_length <= 20:
            score = 100.0
        elif 10 <= avg_length < 15:
            # Slightly short but readable
            score = 80.0
        elif 20 < avg_length <= 30:
            # Slightly long
            score = 70.0
        elif avg_length < 10:
            score = 60.0
        else:
            # avg > 30 – too dense
            score = 50.0

        return score

    def _evaluate_structure(self, content: str) -> float:
        """
        Evaluate document structure by checking for headings, code blocks,
        and lists.  Score = (elements_found / 3) * 100.
        """
        checks = 0

        # 1. Headings (Markdown # / ## / bold **)
        if re.search(r"(^|\n)(#{1,3}\s|\*\*[A-Z])", content):
            checks += 1

        # 2. Code blocks (``` fenced or 4-space indented)
        if re.search(r"(```|~~~|    \S)", content):
            checks += 1

        # 3. Lists (bullet or numbered)
        if re.search(r"(^\s*[-*+]\s|\n\d+\.\s)", content, re.MULTILINE):
            checks += 1

        return (checks / 3) * 100

    def _find_missing_sections(self, content: str) -> List[str]:
        """Return the required sections that are absent from the document."""
        lower = content.lower()
        return [
            section for section in self.REQUIRED_SECTIONS if section not in lower
        ]

    def _calculate_readability_grade(self, content: str) -> str:
        """
        Estimate readability using a Flesch Reading Ease approximation.

        Flesch RE = 206.835 - 1.015*(words/sentences) - 84.6*(syllables/words)

        Grade mapping:
          ≥ 70   → High School
          ≥ 50   → College
          ≥ 30   → Graduate
           < 30  → Expert
        """
        words = content.split()
        sentences = re.split(r"[.!?]+", content)
        sentences = [s for s in sentences if s.strip()]

        if not words or not sentences:
            return "Unknown"

        avg_words_per_sentence = len(words) / len(sentences)

        # Simple syllable estimate: count vowel groups
        total_syllables = sum(
            max(1, len(re.findall(r"[aeiouAEIOU]+", word))) for word in words
        )
        avg_syllables_per_word = total_syllables / len(words)

        flesch = (
            206.835
            - 1.015 * avg_words_per_sentence
            - 84.6 * avg_syllables_per_word
        )

        if flesch >= 70:
            return "High School"
        elif flesch >= 50:
            return "College"
        elif flesch >= 30:
            return "Graduate"
        else:
            return "Expert / Technical"

    # ------------------------------------------------------------------
    # Helper Methods
    # ------------------------------------------------------------------
    def _count_code_examples(self, content: str) -> int:
        """Count the number of code blocks (fenced or inline)."""
        fenced = len(re.findall(r"```", content)) // 2
        inline_ticks = len(re.findall(r"`[^`\n]+`", content))
        return fenced + inline_ticks

    def _check_for_images_diagrams(self, content: str) -> bool:
        """
        Check if documentation includes visual aids.
        Looks for Markdown image syntax, HTML <img>, or diagram references.
        """
        patterns = [
            r"!\[.*?\]\(.*?\)",        # Markdown image
            r"<img\s",                  # HTML img tag
            r"\b(diagram|figure|fig\.|chart|screenshot)\b",  # text references
        ]
        return any(re.search(p, content, re.IGNORECASE) for p in patterns)

    def _extract_table_of_contents(self, content: str) -> List[str]:
        """Extract all section headers (Markdown # headings or bold lines)."""
        headers: List[str] = []

        # Markdown headings
        for match in re.finditer(r"^(#{1,4})\s+(.+)$", content, re.MULTILINE):
            level = len(match.group(1))
            prefix = "  " * (level - 1) + "•"
            headers.append(f"{prefix} {match.group(2).strip()}")

        # Bold uppercase lines (common in plain text docs)
        if not headers:
            for match in re.finditer(r"^\*\*([A-Z][^*]+)\*\*\s*$", content, re.MULTILINE):
                headers.append(f"• {match.group(1).strip()}")

        return headers

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _empty_response(self, reason: str) -> Dict[str, Any]:
        return {
            "final_score": 0.0,
            "completeness": 0.0,
            "clarity": 0.0,
            "structure": 0.0,
            "word_count": 0,
            "missing_sections": self.REQUIRED_SECTIONS[:],
            "readability_grade": "Unknown",
            "code_examples_count": 0,
            "has_visuals": False,
            "table_of_contents": [],
            "error": reason,
        }
