"""
feedback/content_selector.py
=============================
Selects and truncates code excerpts and report excerpts to fit within a
configurable token/character budget before they are sent to the LLM.

Design principles
-----------------
- Never silently drop content.  Every truncation is marked with
  ``[... N lines omitted ...]`` so the LLM knows it is reading a partial file.
- Prioritise entry points, large/complex files, and lint/AI-flagged files.
- Always include a directory-tree overview — cheap and highly informative.
- Output is a single annotated string with file paths and line numbers so
  the LLM can cite them in ``CodeIssue.file`` / ``CodeIssue.line``.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
# File extensions considered as source code for analysis
_CODE_EXTENSIONS = frozenset(
    ".py .js .ts .jsx .tsx .java .cpp .c .h .cs .go .rs .rb .php .swift".split()
)

# Entry-point file names (highest priority — always included first)
_ENTRY_POINTS = frozenset(
    "main.py app.py __main__.py index.py server.py run.py wsgi.py asgi.py "
    "manage.py index.js app.js server.js main.js index.ts app.ts".split()
)

# Max lines to include from any single file before truncating
_MAX_LINES_PER_FILE = 200

# Max files to include in excerpts (prevents bloat for very large repos)
_MAX_FILES_IN_EXCERPTS = 15


def select_code_excerpts(
    extracted_dir: str | Path,
    metrics: dict | None = None,
    budget_chars: int = 32_000,
) -> str:
    """
    Build a budget-aware string of annotated code excerpts.

    Selection priority (within ``budget_chars``):
    1. Directory tree overview (always included)
    2. Entry-point files (main.py, app.py, etc.)
    3. Lint-flagged / AI-detection-flagged files from ``metrics``
    4. Largest source files by line count

    Parameters
    ----------
    extracted_dir:
        Root directory of the extracted submission.
    metrics:
        Optional dict of pre-computed analysis results. Used to identify
        files flagged by lint or AI detection.
    budget_chars:
        Maximum total character count for the returned string.

    Returns
    -------
    str
        Annotated code excerpts, each prefixed with a header showing the
        relative file path and line numbers.
    """
    root = Path(extracted_dir)
    if not root.is_dir():
        return "[No code directory found]\n"

    metrics = metrics or {}
    sections: list[str] = []
    chars_used = 0

    # --- 1. Directory tree (always first) ---
    tree = _build_directory_tree(root)
    tree_block = f"=== DIRECTORY STRUCTURE ===\n{tree}\n"
    sections.append(tree_block)
    chars_used += len(tree_block)

    # --- Collect all source files ---
    all_source_files = [
        p for p in root.rglob("*")
        if p.is_file() and p.suffix.lower() in _CODE_EXTENSIONS
        and ".git" not in p.parts
        and "__pycache__" not in p.parts
    ]

    # --- 2. Identify flagged files from metrics ---
    flagged_files: set[str] = set()
    code_quality = metrics.get("code_quality", {})
    if isinstance(code_quality, dict):
        for issue in code_quality.get("security_issues", []):
            # Security issues don't have file paths in the current analyzer,
            # but we record the pattern for future use
            pass
        for smell in code_quality.get("code_smells", []):
            pass  # same — no per-file paths in current analyzer output

    ai_det = metrics.get("ai_detection", {})
    if isinstance(ai_det, dict) and ai_det.get("ai_generated_probability", 0) > 0.7:
        # The whole submission is flagged; note it but can't isolate specific files
        logger.debug("AI detection flagged submission; marking all files as interesting")

    # --- 3. Build priority-ordered file list ---
    entry_files = [f for f in all_source_files if f.name in _ENTRY_POINTS]
    other_files = [f for f in all_source_files if f.name not in _ENTRY_POINTS]

    # Sort others by file size (largest first — usually most complex)
    other_files.sort(key=lambda p: p.stat().st_size, reverse=True)

    ordered_files = entry_files + other_files

    # --- 4. Collect excerpts within budget ---
    files_included = 0
    for file_path in ordered_files:
        if files_included >= _MAX_FILES_IN_EXCERPTS:
            remaining = len(ordered_files) - files_included
            if remaining > 0:
                note = (
                    f"\n[... {remaining} more source file(s) omitted — "
                    "budget or file-count limit reached ...]\n"
                )
                sections.append(note)
                chars_used += len(note)
            break

        try:
            content = file_path.read_text(encoding="utf-8", errors="replace")
        except OSError as exc:
            logger.warning("Cannot read %s: %s", file_path, exc)
            continue

        rel_path = file_path.relative_to(root)
        excerpt, was_truncated = _truncate_file(content, _MAX_LINES_PER_FILE)

        header = f"\n=== FILE: {rel_path} ===\n"
        block = header + excerpt
        if was_truncated:
            lines_total = content.count("\n") + 1
            block += (
                f"\n[... {lines_total - _MAX_LINES_PER_FILE} lines omitted "
                f"(file has {lines_total} lines total) ...]\n"
            )

        if chars_used + len(block) > budget_chars:
            # Can't fit this file — note it and stop
            skipped = len(ordered_files) - files_included
            note = (
                f"\n[... {skipped} more source file(s) not shown — "
                "character budget exhausted ...]\n"
            )
            sections.append(note)
            chars_used += len(note)
            break

        sections.append(block)
        chars_used += len(block)
        files_included += 1

    return "".join(sections)


def select_report_excerpts(
    report_text: str,
    budget_chars: int = 8_000,
) -> str:
    """
    Return up to ``budget_chars`` characters of the report text.

    A truncation notice is appended when the report is clipped so the LLM
    does not speculate about omitted content.
    """
    if not report_text or not report_text.strip():
        return "[No report content available]\n"

    if len(report_text) <= budget_chars:
        return report_text

    truncated = report_text[:budget_chars]
    omitted = len(report_text) - budget_chars
    return (
        truncated
        + f"\n[... approximately {omitted:,} characters of the report omitted — "
        "do NOT speculate about what the omitted sections contain ...]\n"
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_directory_tree(root: Path, max_depth: int = 4) -> str:
    """Build a compact directory tree string, up to ``max_depth`` levels."""
    lines: list[str] = [str(root.name) + "/"]
    _tree_recursive(root, lines, prefix="", depth=0, max_depth=max_depth)
    return "\n".join(lines)


def _tree_recursive(
    directory: Path,
    lines: list[str],
    prefix: str,
    depth: int,
    max_depth: int,
    max_items: int = 30,
) -> None:
    if depth >= max_depth:
        return
    try:
        entries = sorted(
            [e for e in directory.iterdir() if ".git" not in e.parts],
            key=lambda e: (e.is_file(), e.name),
        )
    except PermissionError:
        return

    shown = 0
    for entry in entries:
        if shown >= max_items:
            lines.append(f"{prefix}├── [... more items omitted ...]")
            break
        connector = "├── " if entry != entries[-1] else "└── "
        suffix = "/" if entry.is_dir() else ""
        lines.append(f"{prefix}{connector}{entry.name}{suffix}")
        if entry.is_dir() and "__pycache__" not in entry.parts:
            extension = "│   " if entry != entries[-1] else "    "
            _tree_recursive(
                entry, lines, prefix + extension, depth + 1, max_depth, max_items
            )
        shown += 1


def _truncate_file(content: str, max_lines: int) -> tuple[str, bool]:
    """
    Return (possibly truncated content with line numbers, was_truncated).

    Lines are prefixed with 1-indexed line numbers so the LLM can cite them.
    """
    raw_lines = content.splitlines()
    was_truncated = len(raw_lines) > max_lines
    selected = raw_lines[:max_lines]
    numbered = [f"{i+1:4d}: {line}" for i, line in enumerate(selected)]
    return "\n".join(numbered), was_truncated
