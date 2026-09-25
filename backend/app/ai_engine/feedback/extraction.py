"""
feedback/extraction.py
======================
Safe zip extraction and report text extraction.

Security guarantees
-------------------
- Path traversal: every zip entry is resolved against the target directory;
  entries that escape are rejected with ``PathTraversalError``.
- Symlinks: rejected outright.
- Zip bombs: cumulative uncompressed size is tracked; exceeding
  ``max_size_bytes`` raises ``ZipBombError``.
- File count: exceeding ``max_files`` raises ``TooManyFilesError``.

Report extraction delegates to the existing DocumentationEvaluator parsers
(pdfplumber → pypdf fallback, python-docx, plain text) to avoid duplication.
"""

from __future__ import annotations

import logging
import os
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Custom exceptions
# ---------------------------------------------------------------------------
class ExtractionError(Exception):
    """Base class for all extraction failures."""


class PathTraversalError(ExtractionError):
    """Raised when a zip entry would escape the target directory."""


class ZipBombError(ExtractionError):
    """Raised when extracted content exceeds the size cap."""


class TooManyFilesError(ExtractionError):
    """Raised when the zip contains more entries than the file-count cap."""


class UnsupportedFileTypeError(ExtractionError):
    """Raised when the report file type cannot be extracted."""


# ---------------------------------------------------------------------------
# Extraction result
# ---------------------------------------------------------------------------
@dataclass
class ExtractionResult:
    files: list[Path] = field(default_factory=list)
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# Safe zip extractor
# ---------------------------------------------------------------------------
_DEFAULT_MAX_SIZE_BYTES = 100 * 1024 * 1024   # 100 MB
_DEFAULT_MAX_FILES = 500


def safe_extract_zip(
    zip_path: str | Path,
    target_dir: str | Path,
    max_size_bytes: int = _DEFAULT_MAX_SIZE_BYTES,
    max_files: int = _DEFAULT_MAX_FILES,
) -> ExtractionResult:
    """
    Extract *zip_path* into *target_dir* with security checks.

    Parameters
    ----------
    zip_path:
        Path to the zip file to extract.
    target_dir:
        Directory to extract into (must already exist or will be created).
    max_size_bytes:
        Maximum cumulative uncompressed size in bytes (zip-bomb guard).
    max_files:
        Maximum number of files allowed in the archive.

    Returns
    -------
    ExtractionResult
        On success: ``files`` contains every extracted Path.
        On failure: raises one of the custom exceptions above.
    """
    zip_path = Path(zip_path)
    target_dir = Path(target_dir).resolve()
    target_dir.mkdir(parents=True, exist_ok=True)

    if not zip_path.exists():
        raise ExtractionError(f"Zip file not found: {zip_path}")

    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            entries = zf.infolist()

            # --- File count guard ---
            if len(entries) > max_files:
                raise TooManyFilesError(
                    f"Archive contains {len(entries)} entries; limit is {max_files}. "
                    "Rejecting to prevent resource exhaustion."
                )

            # --- Size guard (zip-bomb) ---
            total_uncompressed = sum(e.file_size for e in entries)
            if total_uncompressed > max_size_bytes:
                raise ZipBombError(
                    f"Total uncompressed size {total_uncompressed:,} bytes exceeds "
                    f"limit of {max_size_bytes:,} bytes. Rejecting as potential zip bomb."
                )

            extracted: list[Path] = []

            for entry in entries:
                # --- Symlink guard ---
                # Unix external_attr stores mode in upper 16 bits; symlink mode = 0o120000
                unix_mode = (entry.external_attr >> 16) & 0xFFFF
                if unix_mode & 0o170000 == 0o120000:
                    logger.warning(
                        "Skipping symlink entry %s in %s", entry.filename, zip_path
                    )
                    continue

                # --- Path traversal guard ---
                # Resolve the destination path; it must stay inside target_dir.
                dest = (target_dir / entry.filename).resolve()
                try:
                    dest.relative_to(target_dir)
                except ValueError:
                    raise PathTraversalError(
                        f"Zip entry '{entry.filename}' would extract outside "
                        f"target directory '{target_dir}'. Rejecting submission."
                    )

                # Extract
                zf.extract(entry, target_dir)
                if dest.is_file():
                    extracted.append(dest)

            logger.info(
                "Extracted %d files from %s (total %s bytes)",
                len(extracted),
                zip_path.name,
                total_uncompressed,
            )
            return ExtractionResult(files=extracted)

    except zipfile.BadZipFile as exc:
        raise ExtractionError(f"Corrupt or invalid zip file: {exc}") from exc


# ---------------------------------------------------------------------------
# Report text extraction
# ---------------------------------------------------------------------------
def extract_report_text(report_path: str | Path) -> str:
    """
    Extract plain text from a report file.

    Supported formats: .pdf, .docx, .md, .txt, .rst
    Falls back to plain-text read for unknown extensions.

    Raises
    ------
    ExtractionError
        If the file does not exist or all parsers fail.
    """
    path = Path(report_path)
    if not path.exists():
        raise ExtractionError(f"Report file not found: {path}")

    suffix = path.suffix.lower()

    if suffix == ".pdf":
        return _extract_pdf(path)
    elif suffix == ".docx":
        return _extract_docx(path)
    elif suffix in {".md", ".txt", ".rst"}:
        return _extract_plain(path)
    else:
        # Unknown extension — try plain text as fallback
        logger.warning(
            "Unknown report extension '%s'; attempting plain-text read.", suffix
        )
        return _extract_plain(path)


def _extract_pdf(path: Path) -> str:
    """pdfplumber → pypdf fallback."""
    # Primary: pdfplumber (better table/layout handling)
    try:
        import pdfplumber  # type: ignore

        text_parts: list[str] = []
        with pdfplumber.open(str(path)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        if text_parts:
            return "\n".join(text_parts)
    except Exception as exc:
        logger.debug("pdfplumber failed (%s); trying pypdf", exc)

    # Fallback: pypdf
    try:
        from pypdf import PdfReader  # type: ignore

        reader = PdfReader(str(path))
        parts = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(parts)
    except Exception as exc:
        raise ExtractionError(f"PDF extraction failed for {path}: {exc}") from exc


def _extract_docx(path: Path) -> str:
    """python-docx extraction."""
    try:
        from docx import Document  # type: ignore

        doc = Document(str(path))
        return "\n".join(para.text for para in doc.paragraphs)
    except Exception as exc:
        raise ExtractionError(f"DOCX extraction failed for {path}: {exc}") from exc


def _extract_plain(path: Path) -> str:
    """Plain-text read with encoding fallback."""
    for encoding in ("utf-8", "utf-16", "latin-1"):
        try:
            return path.read_text(encoding=encoding)
        except (UnicodeDecodeError, LookupError):
            continue
    raise ExtractionError(
        f"Could not decode {path} with utf-8, utf-16, or latin-1."
    )
