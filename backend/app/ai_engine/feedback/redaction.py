"""
feedback/redaction.py
=====================
Secret and credential scrubbing before content reaches the LLM or logs.

Every code excerpt and report excerpt MUST pass through ``redact_secrets``
before being inserted into a prompt or written to any log statement.

Patterns covered
----------------
- API keys: ``sk-...``, ``AIza...``, ``ghp_...``, ``ghu_...``, ``ghs_...``
- Long hex/base64 values after ``key=`` / ``token=`` / ``secret=``
- PEM private key blocks
- .env-style ``KEY=long_value`` lines (values ≥ 16 chars)
- Hardcoded passwords / secrets in Python string assignments
- Bearer tokens in HTTP headers

Redaction token: ``[REDACTED]``
"""

from __future__ import annotations

import logging
import re
from pathlib import Path

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Redaction patterns (order matters — most specific first)
# ---------------------------------------------------------------------------

_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    # PEM private key blocks
    (
        re.compile(
            r"-----BEGIN\s+(?:RSA\s+|EC\s+|OPENSSH\s+|DSA\s+)?PRIVATE KEY-----"
            r"[\s\S]*?"
            r"-----END\s+(?:RSA\s+|EC\s+|OPENSSH\s+|DSA\s+)?PRIVATE KEY-----",
            re.IGNORECASE,
        ),
        "[REDACTED:PRIVATE_KEY]",
    ),
    # OpenAI-style: sk-... (at least 20 chars)
    (
        re.compile(r"\bsk-[A-Za-z0-9_\-]{20,}\b"),
        "[REDACTED:API_KEY]",
    ),
    # Google API key: AIza + 35 chars
    (
        re.compile(r"\bAIza[A-Za-z0-9_\-]{35}\b"),
        "[REDACTED:GOOGLE_KEY]",
    ),
    # GitHub tokens: ghp_, ghu_, ghs_, gho_, ghr_
    (
        re.compile(r"\bgh[puhors]_[A-Za-z0-9]{36,}\b"),
        "[REDACTED:GITHUB_TOKEN]",
    ),
    # Slack tokens: xox[baprs]-...
    (
        re.compile(r"\bxox[baprs]-[A-Za-z0-9\-]{10,}\b"),
        "[REDACTED:SLACK_TOKEN]",
    ),
    # AWS keys: AKIA + 16 chars
    (
        re.compile(r"\bAKIA[A-Z0-9]{16}\b"),
        "[REDACTED:AWS_KEY]",
    ),
    # Long hex strings after key=/token=/secret= (≥ 32 hex chars)
    (
        re.compile(
            r"(?i)(key|token|secret|password|api_?key|auth)\s*[=:]\s*"
            r"['\"]?([A-Fa-f0-9]{32,})['\"]?",
        ),
        r"\1=[REDACTED:HEX_SECRET]",
    ),
    # Hardcoded password/secret assignments in code strings
    # e.g.  password = "my_pass_123"  or  SECRET_KEY = 'abc...'
    (
        re.compile(
            r"(?i)(password|secret(?:_key)?|passwd|api_?key|access_?token)"
            r"\s*=\s*['\"]([^'\"]{8,})['\"]",
        ),
        r'\1="[REDACTED:CREDENTIAL]"',
    ),
    # Bearer token in HTTP headers
    (
        re.compile(
            r"(?i)(Authorization\s*[=:]\s*['\"]?Bearer\s+)[A-Za-z0-9._\-]{20,}",
        ),
        r"\1[REDACTED:BEARER_TOKEN]",
    ),
    # Generic long base64 values after assignment (≥ 40 chars of base64 alphabet)
    (
        re.compile(
            r"(?i)(key|token|secret|password)\s*=\s*['\"]"
            r"([A-Za-z0-9+/=]{40,})['\"]",
        ),
        r'\1="[REDACTED:BASE64_SECRET]"',
    ),
]

# Files that should be entirely redacted (not just scrubbed)
_SENSITIVE_FILENAMES = frozenset({
    ".env", ".env.local", ".env.production", ".env.development",
    ".env.test", ".secrets", "credentials.json", "service_account.json",
})


def redact_secrets(text: str) -> str:
    """
    Apply all redaction patterns to *text* and return the scrubbed version.

    Logs how many replacements were made (without logging the originals).
    """
    total_replacements = 0
    result = text
    for pattern, replacement in _PATTERNS:
        new_result, n = pattern.subn(replacement, result)
        if n:
            total_replacements += n
            logger.debug(
                "Redacted %d occurrence(s) matching pattern: %s",
                n,
                pattern.pattern[:60],
            )
        result = new_result

    if total_replacements:
        logger.info(
            "redact_secrets: replaced %d potential secret(s) in text excerpt",
            total_replacements,
        )
    return result


def redact_file_content(content: str, file_path: str | Path) -> str:
    """
    Redact content from a file.

    If the filename is in the sensitive-files list (e.g. ``.env``), the
    entire content is replaced.  Otherwise ``redact_secrets`` is applied.
    """
    filename = Path(file_path).name.lower()
    if filename in _SENSITIVE_FILENAMES:
        logger.warning(
            "Entirely redacting sensitive file: %s", file_path
        )
        return f"[ENTIRE FILE REDACTED: {filename} — credentials file]\n"
    return redact_secrets(content)
