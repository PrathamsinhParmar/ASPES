"""
feedback/generator.py
=====================
Orchestrates the AI Feedback Generation pipeline.

Follows the pipeline structure:
  1. Validate inputs (sizes)
  2. Safe extract zip & report
  3. Hash content & check cache
  4. Select budget-aware excerpts
  5. Redact secrets
  6. Build prompts
  7. Multi-provider LLM call (Gemini → Groq → heuristic fallback)
  8. Render Markdown
  9. Cache & Return
"""

from __future__ import annotations

import asyncio
import logging
import time
import uuid
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any

from app.config import settings

from .cache import get_feedback_cache, hash_content
from .content_selector import select_code_excerpts, select_report_excerpts
from .extraction import extract_report_text, safe_extract_zip
from .fallback import generate_heuristic_feedback
from .llm_client import HeuristicFallbackSignal, get_llm_client
from .models import FeedbackResponse, FeedbackResult
from .narrative_renderer import render_narrative
from .prompt_builder import build_metrics_block, build_system_prompt, build_user_prompt
from .redaction import redact_file_content, redact_secrets

logger = logging.getLogger(__name__)


class FeedbackGenerator:
    """
    Main entry point for generating comprehensive feedback from a student's
    submitted zip file and report file, augmented by static metrics.
    """

    def __init__(self) -> None:
        self.llm_client = get_llm_client()
        self.cache = get_feedback_cache()

        # Limits from config
        self.max_zip_bytes: int = getattr(
            settings, "FEEDBACK_MAX_ZIP_SIZE_BYTES", 100 * 1024 * 1024
        )
        self.max_zip_files: int = getattr(settings, "FEEDBACK_MAX_ZIP_FILES", 500)
        self.max_report_bytes: int = getattr(
            settings, "FEEDBACK_MAX_REPORT_SIZE_BYTES", 10 * 1024 * 1024
        )
        self.code_budget: int = getattr(settings, "FEEDBACK_CODE_BUDGET_CHARS", 32000)
        self.report_budget: int = getattr(settings, "FEEDBACK_REPORT_BUDGET_CHARS", 8000)

    async def generate(
        self,
        code_zip: str | Path,
        report_file: str | Path,
        metrics: dict[str, Any] | None = None,
        correlation_id: str | None = None,
    ) -> FeedbackResult:
        """
        Execute the feedback pipeline.

        Parameters
        ----------
        code_zip:
            Path to the submitted zip file.
        report_file:
            Path to the submitted report file (pdf, docx, md, txt).
        metrics:
            Optional pre-computed metrics dict from upstream analyzers.
        correlation_id:
            Optional UUID for trace logging.
        """
        t_start = time.monotonic()
        cid = correlation_id or str(uuid.uuid4())[:8]
        log_prefix = f"[{cid}]"

        logger.info("%s Starting feedback generation", log_prefix)
        metrics = metrics or {}

        # 1. Basic size validation before extraction
        code_zip_path = Path(code_zip)
        report_path = Path(report_file)

        if code_zip_path.exists() and code_zip_path.stat().st_size > self.max_zip_bytes:
            logger.warning(
                "%s Zip exceeds max size: %d bytes", log_prefix, code_zip_path.stat().st_size
            )
            # We don't hard crash here, safe_extract_zip has a separate uncompressed check,
            # but we can log heavily.

        if report_path.exists() and report_path.stat().st_size > self.max_report_bytes:
            logger.warning(
                "%s Report exceeds max size: %d bytes", log_prefix, report_path.stat().st_size
            )

        with TemporaryDirectory(prefix="aspes_feedback_") as tmpdir:
            tmp_path = Path(tmpdir)

            # 2. Extract content safely
            logger.debug("%s Extracting zip and report", log_prefix)
            try:
                extract_res = safe_extract_zip(
                    code_zip_path,
                    tmp_path,
                    max_size_bytes=self.max_zip_bytes,
                    max_files=self.max_zip_files,
                )
            except Exception as exc:
                logger.error("%s Zip extraction failed: %s", log_prefix, exc)
                # Fallback to heuristic immediately on bad zip
                return self._build_heuristic_result(metrics, cid, t_start, str(exc))

            try:
                raw_report_text = extract_report_text(report_path)
            except Exception as exc:
                logger.warning("%s Report extraction failed: %s", log_prefix, exc)
                raw_report_text = "[Report extraction failed]"

            # 3. Hash content & Check Cache
            # First, compute a content hash for the entire extracted tree
            code_hash_input = []
            for p in sorted(extract_res.files):
                if p.is_file():
                    try:
                        # Quick hash of file content
                        # If repo is huge, this might be slow, but safe_extract_zip caps sizes.
                        # For speed, we hash filename + size + mtime, but content is safer.
                        # We'll use actual content to be perfectly deterministic.
                        content = p.read_bytes()
                        code_hash_input.append(hashlib.sha256(content).hexdigest())
                    except Exception:
                        pass
            
            # If no files, or reading failed, use a placeholder
            code_content_hash = hash_content("".join(code_hash_input) if code_hash_input else "empty_code")
            report_content_hash = hash_content(raw_report_text)

            # We need to check cache per-provider in priority order.
            # We'll build the primary provider's cache key first.
            primary_provider = getattr(settings, "FEEDBACK_LLM_PRIMARY_PROVIDER", "gemini")
            
            import hashlib
            from .prompt_builder import PROMPT_VERSION
            
            # Get the provider_key from the client directly
            # Hack: we instantiate the clients just to get their provider keys
            from .llm_client import GeminiLLMClient, GroqLLMClient
            
            if primary_provider == "gemini":
                primary_key = GeminiLLMClient().provider_key
            else:
                primary_key = GroqLLMClient().provider_key

            cache_key = self.cache.make_key(
                provider_key=primary_key,
                code_content_hash=code_content_hash,
                report_content_hash=report_content_hash,
                metrics=metrics,
            )

            cached_result = await self.cache.get(cache_key)
            if cached_result:
                logger.info("%s Cache hit for %s", log_prefix, primary_key)
                cached_result.cache_hit = True
                cached_result.correlation_id = cid
                cached_result.latency_ms = (time.monotonic() - t_start) * 1000
                return cached_result

            # 4. Content selection (budget aware)
            # Before selection, we redact the individual files in place? No, we select first,
            # then redact the final excerpt string to save regex time.
            logger.debug("%s Selecting excerpts", log_prefix)
            code_excerpts = select_code_excerpts(tmp_path, metrics, self.code_budget)
            report_excerpts = select_report_excerpts(raw_report_text, self.report_budget)

            # 5. Redact secrets
            logger.debug("%s Redacting secrets", log_prefix)
            safe_code = redact_secrets(code_excerpts)
            safe_report = redact_secrets(report_excerpts)

            # 6. Build prompts
            system_prompt = build_system_prompt()
            metrics_block = build_metrics_block(metrics)
            user_prompt = build_user_prompt(
                metrics_block, safe_code, safe_report, model_name="{model_placeholder}"
            )

            # 7. LLM Call
            logger.info("%s Calling LLM providers", log_prefix)
            try:
                response_model, provider_used = await self.llm_client.generate_structured(
                    system=system_prompt,
                    user=user_prompt,
                    schema=FeedbackResponse,
                    correlation_id=cid,
                )
                
                # The LLM doesn't know its own model name when it generates the JSON,
                # so we overwrite the meta fields here to guarantee accuracy.
                from datetime import datetime, timezone
                response_model.meta.model_name = provider_used
                response_model.meta.generated_at = datetime.now(timezone.utc).isoformat()
                
            except HeuristicFallbackSignal as exc:
                logger.warning("%s %s", log_prefix, exc)
                return self._build_heuristic_result(metrics, cid, t_start)
            except Exception as exc:
                logger.error("%s Unhandled error in LLM call: %s", log_prefix, exc)
                return self._build_heuristic_result(metrics, cid, t_start, error_str=str(exc))

            # 8. Render Narrative
            logger.debug("%s Rendering narrative", log_prefix)
            narrative = render_narrative(response_model)

            result = FeedbackResult(
                structured_json=response_model,
                narrative_md=narrative,
                cache_hit=False,
                provider_used=provider_used,
                latency_ms=(time.monotonic() - t_start) * 1000,
                correlation_id=cid,
            )

            # 9. Cache
            # Note: we use the actual provider_used for the cache key, in case we fell back to Groq
            final_cache_key = self.cache.make_key(
                provider_key=provider_used,
                code_content_hash=code_content_hash,
                report_content_hash=report_content_hash,
                metrics=metrics,
            )
            await asyncio.shield(self.cache.set(final_cache_key, result))

            logger.info(
                "%s Completed successfully in %.0fms (provider=%s)",
                log_prefix,
                result.latency_ms,
                provider_used,
            )
            return result

    def _build_heuristic_result(
        self,
        metrics: dict[str, Any],
        cid: str,
        t_start: float,
        error_str: str | None = None,
    ) -> FeedbackResult:
        """Helper to build a deterministic fallback result when extraction or LLMs fail."""
        logger.info("[%s] Building heuristic fallback result", cid)
        
        response = generate_heuristic_feedback(metrics)
        
        if error_str:
            if not response.instructor_notes:
                response.instructor_notes = ""
            response.instructor_notes += f" | SYSTEM ERROR: {error_str}"

        narrative = render_narrative(response)
        
        return FeedbackResult(
            structured_json=response,
            narrative_md=narrative,
            cache_hit=False,
            provider_used="heuristic_fallback",
            latency_ms=(time.monotonic() - t_start) * 1000,
            correlation_id=cid,
        )
