"""
feedback/llm_client.py
======================
Provider-agnostic async LLM client with:
  - Two concrete providers: Gemini Flash (google-genai SDK) and Groq (httpx).
  - Client-side rate limiters per provider (token-bucket, Redis-backed for
    multi-process correctness across Celery workers).
  - Proactive daily-quota tracking in Redis; switches to Groq before hitting
    Gemini's RPD cap.
  - Falls through to heuristic_fallback when both providers are exhausted.
  - Per-provider repair retry budgets (1 for Gemini, 2 for Groq).
  - Structured logging on every attempt.

=============================================================================
POLICY DECISION REQUIRED
=============================================================================
Gemini's free tier permits Google to use prompts and model outputs to improve
their products, with possible human review.  Real student source code and
academic report content will pass through this endpoint.

Before deploying to production, ensure:
  1. Institutional data-handling policies permit third-party processing of
     student submissions (FERPA / GDPR / local equivalents may apply).
  2. Students are informed in the platform's privacy notice.
  3. If policy prohibits this, switch to a self-hosted model or Groq-only
     mode and disable Gemini (FEEDBACK_LLM_PRIMARY_PROVIDER=groq).
=============================================================================

Provider chain (free-tier only):
  Gemini Flash  →  Groq (Llama/Qwen)  →  heuristic fallback

No paid API calls are made.  Both providers are free-tier gated by daily
request counters stored in Redis.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from abc import ABC, abstractmethod
from datetime import date
from typing import Any, Type

import httpx
from pydantic import BaseModel, ValidationError

from app.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lazy Redis client (shared across rate limiter + daily-counter)
# ---------------------------------------------------------------------------
_redis_client: Any = None


def _get_redis() -> Any:
    """Return a (sync) redis.Redis instance, or None if unavailable."""
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    try:
        import redis  # type: ignore

        _redis_client = redis.Redis.from_url(
            settings.REDIS_URL,  # type: ignore[attr-defined]
            db=3,  # separate DB from Celery and feedback cache
            decode_responses=True,
            socket_connect_timeout=2,
        )
        _redis_client.ping()
        logger.debug("LLM client Redis connection established (db=3).")
    except Exception as exc:
        logger.warning(
            "Redis unavailable for LLM rate-limiter (%s). "
            "Falling back to in-process limiters (multi-worker accuracy reduced).",
            exc,
        )
        _redis_client = None
    return _redis_client


# ---------------------------------------------------------------------------
# Client-side rate limiter
# ---------------------------------------------------------------------------
class ClientSideRateLimiter:
    """
    Sliding-window rate limiter that delays (never drops) requests exceeding
    the configured RPM.

    Redis is used for cross-process correctness when multiple Celery workers
    share the same API key.  Falls back to an asyncio-local approach if Redis
    is unavailable (accuracy reduced for multi-worker deployments).
    """

    def __init__(self, provider: str, rpm: int) -> None:
        self._provider = provider
        self._rpm = max(rpm, 1)
        self._min_interval = 60.0 / self._rpm
        self._lock = asyncio.Lock()
        self._last_request_ts: float = 0.0  # in-process fallback

    async def acquire(self) -> None:
        """Block until a slot is available according to RPM."""
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self._last_request_ts
            if elapsed < self._min_interval:
                wait = self._min_interval - elapsed
                logger.debug(
                    "Rate limiter (%s): sleeping %.2fs to stay within %d RPM",
                    self._provider,
                    wait,
                    self._rpm,
                )
                await asyncio.sleep(wait)
            self._last_request_ts = time.monotonic()


# ---------------------------------------------------------------------------
# Daily request counter (Redis-backed)
# ---------------------------------------------------------------------------
def _get_daily_count(provider: str) -> int:
    """Return today's request count for *provider* from Redis."""
    r = _get_redis()
    if r is None:
        return 0
    key = f"feedback:{provider}:rpd:{date.today().isoformat()}"
    try:
        val = r.get(key)
        return int(val) if val else 0
    except Exception:
        return 0


def _increment_daily_count(provider: str) -> None:
    """Increment today's request count; set 25-hour TTL to auto-expire."""
    r = _get_redis()
    if r is None:
        return
    key = f"feedback:{provider}:rpd:{date.today().isoformat()}"
    try:
        pipe = r.pipeline()
        pipe.incr(key)
        pipe.expire(key, 90_000)  # 25 hours
        pipe.execute()
    except Exception as exc:
        logger.debug("Failed to increment daily counter for %s: %s", provider, exc)


# ---------------------------------------------------------------------------
# Abstract LLM client
# ---------------------------------------------------------------------------
class LLMClient(ABC):
    """Provider-agnostic interface."""

    @abstractmethod
    async def generate_structured(
        self,
        system: str,
        user: str,
        schema: Type[BaseModel],
        repair_retries: int = 1,
    ) -> BaseModel:
        """
        Call the LLM and return a validated Pydantic model instance.

        Parameters
        ----------
        system: System prompt text.
        user: User prompt text.
        schema: The Pydantic model class to validate/parse the response into.
        repair_retries: How many times to retry with the validation error
            appended when the response fails schema validation.

        Raises
        ------
        LLMError: On unrecoverable failure (exhausted retries, auth, safety).
        """

    @property
    @abstractmethod
    def provider_key(self) -> str:
        """Unique provider key used in cache keys, e.g. 'gemini:gemini-2.5-flash'."""


class LLMError(Exception):
    """Raised when the LLM call fails after all retries."""


# ---------------------------------------------------------------------------
# Gemini client (google-genai SDK)
# ---------------------------------------------------------------------------
class GeminiLLMClient(LLMClient):
    """
    Gemini Flash via the new google-genai SDK (not the deprecated
    google-generativeai package).

    Uses native structured output:
      client.aio.models.generate_content(
          config=types.GenerateContentConfig(
              response_mime_type="application/json",
              response_schema=<PydanticClass>,
              ...
          )
      )
    """

    MAX_ATTEMPTS = 3
    BASE_BACKOFF = 1.5  # seconds; jittered

    def __init__(self) -> None:
        self._api_key: str = getattr(settings, "GEMINI_API_KEY", "") or ""
        self._model: str = getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash")
        self._max_tokens: int = getattr(settings, "FEEDBACK_MAX_OUTPUT_TOKENS", 3500)
        self._rpm: int = getattr(settings, "GEMINI_FREE_TIER_RPM", 10)
        self._limiter = ClientSideRateLimiter("gemini", self._rpm)
        self._client: Any = None

    def _ensure_client(self) -> None:
        if self._client is not None:
            return
        if not self._api_key:
            raise LLMError("GEMINI_API_KEY is not configured.")
        try:
            from google import genai  # type: ignore

            self._client = genai.Client(api_key=self._api_key)
            logger.info("Gemini client initialised (model=%s).", self._model)
        except ImportError as exc:
            raise LLMError(
                "google-genai package not installed. "
                "Run: pip install google-genai"
            ) from exc

    @property
    def provider_key(self) -> str:
        return f"gemini:{self._model}"

    async def generate_structured(
        self,
        system: str,
        user: str,
        schema: Type[BaseModel],
        repair_retries: int = 1,
    ) -> BaseModel:
        self._ensure_client()

        from google.genai import types  # type: ignore

        contents = f"{system}\n\n{user}"
        last_error: Exception | None = None
        last_validation_error: str | None = None

        for attempt in range(1, self.MAX_ATTEMPTS + 1):
            await self._limiter.acquire()
            prompt = contents
            if last_validation_error:
                prompt += (
                    f"\n\nPREVIOUS RESPONSE FAILED SCHEMA VALIDATION:\n"
                    f"{last_validation_error}\n"
                    "Please correct the JSON and return a valid response."
                )

            t_start = time.monotonic()
            try:
                response = await asyncio.wait_for(
                    self._client.aio.models.generate_content(
                        model=self._model,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            response_schema=schema,
                            max_output_tokens=self._max_tokens,
                            temperature=0.3,  # lower = more deterministic JSON
                        ),
                    ),
                    timeout=45.0,
                )
                latency = (time.monotonic() - t_start) * 1000
                _increment_daily_count("gemini")

                # Log token usage
                usage = getattr(response, "usage_metadata", None)
                if usage:
                    logger.info(
                        "Gemini usage — prompt_tokens=%s, candidates_tokens=%s, "
                        "latency_ms=%.0f",
                        getattr(usage, "prompt_token_count", "?"),
                        getattr(usage, "candidates_token_count", "?"),
                        latency,
                    )

                raw_text = response.text
                try:
                    instance = schema.model_validate_json(raw_text)
                    logger.info(
                        "Gemini structured output validated on attempt %d.", attempt
                    )
                    return instance
                except (ValidationError, json.JSONDecodeError) as val_exc:
                    last_validation_error = str(val_exc)
                    logger.warning(
                        "Gemini response failed validation (attempt %d): %s",
                        attempt,
                        last_validation_error[:300],
                    )
                    if attempt > repair_retries:
                        raise LLMError(
                            f"Gemini response failed schema validation after "
                            f"{attempt} attempt(s): {last_validation_error}"
                        ) from val_exc

            except asyncio.TimeoutError:
                last_error = LLMError("Gemini request timed out after 45s.")
                logger.warning("Gemini timeout on attempt %d.", attempt)
            except Exception as exc:
                exc_name = type(exc).__name__
                # Distinguish quota/rate-limit from auth from safety
                if "ResourceExhausted" in exc_name or "429" in str(exc):
                    logger.warning(
                        "Gemini rate-limited / quota exhausted (attempt %d): %s",
                        attempt,
                        exc,
                    )
                    last_error = LLMError(f"Gemini quota exhausted: {exc}")
                    # Don't backoff + retry on quota — escalate immediately
                    raise last_error
                elif "PermissionDenied" in exc_name or "UNAUTHENTICATED" in str(exc):
                    logger.error("Gemini auth error: %s", exc)
                    raise LLMError(f"Gemini authentication failed: {exc}") from exc
                elif "BlockedPromptException" in exc_name or "SAFETY" in str(exc):
                    logger.error("Gemini blocked prompt (safety): %s", exc)
                    raise LLMError(f"Gemini safety block: {exc}") from exc
                else:
                    last_error = exc  # type: ignore[assignment]
                    logger.warning(
                        "Gemini unexpected error (attempt %d/%d): %s",
                        attempt,
                        self.MAX_ATTEMPTS,
                        exc,
                    )

            # Exponential backoff with jitter
            if attempt < self.MAX_ATTEMPTS:
                import random

                wait = self.BASE_BACKOFF * (2 ** (attempt - 1)) + random.uniform(0, 0.5)
                await asyncio.sleep(wait)

        raise LLMError(
            f"Gemini failed after {self.MAX_ATTEMPTS} attempts. "
            f"Last error: {last_error}"
        )


# ---------------------------------------------------------------------------
# Groq client (OpenAI-compatible, httpx-based)
# ---------------------------------------------------------------------------
class GroqLLMClient(LLMClient):
    """
    Groq free tier via its OpenAI-compatible REST endpoint.

    Uses httpx directly to avoid adding the groq/openai SDK as a dependency.
    JSON mode is requested; response is parsed and validated against the
    Pydantic schema manually.

    Repair retries: 2 (open models are less reliable at strict nested JSON).
    """

    _ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
    MAX_ATTEMPTS = 3
    BASE_BACKOFF = 2.0

    def __init__(self) -> None:
        self._api_key: str = getattr(settings, "GROQ_API_KEY", "") or ""
        self._model: str = getattr(settings, "GROQ_MODEL", "llama-3.3-70b-versatile")
        self._max_tokens: int = getattr(settings, "FEEDBACK_MAX_OUTPUT_TOKENS", 3500)
        self._rpm: int = getattr(settings, "GROQ_FREE_TIER_RPM", 30)
        self._limiter = ClientSideRateLimiter("groq", self._rpm)

    @property
    def provider_key(self) -> str:
        return f"groq:{self._model}"

    async def generate_structured(
        self,
        system: str,
        user: str,
        schema: Type[BaseModel],
        repair_retries: int = 2,
    ) -> BaseModel:
        if not self._api_key:
            raise LLMError("GROQ_API_KEY is not configured.")

        schema_str = json.dumps(schema.model_json_schema(), indent=2)
        user_with_schema = (
            f"{user}\n\nYou MUST return a JSON object exactly matching this schema:\n"
            f"```json\n{schema_str}\n```"
        )

        last_validation_error: str | None = None

        async with httpx.AsyncClient(timeout=45.0) as client:
            for attempt in range(1, self.MAX_ATTEMPTS + 1):
                await self._limiter.acquire()

                current_user = user_with_schema
                if last_validation_error:
                    current_user += (
                        f"\n\nPREVIOUS RESPONSE FAILED SCHEMA VALIDATION:\n"
                        f"{last_validation_error}\n"
                        "Correct the JSON and try again."
                    )

                payload: dict[str, Any] = {
                    "model": self._model,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": current_user},
                    ],
                    "max_tokens": self._max_tokens,
                    "temperature": 0.3,
                    "response_format": {"type": "json_object"},
                }

                t_start = time.monotonic()
                try:
                    resp = await client.post(
                        self._ENDPOINT,
                        json=payload,
                        headers={"Authorization": f"Bearer {self._api_key}"},
                    )
                    latency = (time.monotonic() - t_start) * 1000

                    if resp.status_code == 429:
                        logger.warning(
                            "Groq rate-limited (attempt %d): %s", attempt, resp.text[:200]
                        )
                        raise LLMError("Groq quota/rate-limit exhausted (429).")
                    if resp.status_code == 503:
                        logger.warning(
                            "Groq unavailable (attempt %d): %s", attempt, resp.text[:200]
                        )
                    resp.raise_for_status()

                    _increment_daily_count("groq")
                    data = resp.json()

                    usage = data.get("usage", {})
                    logger.info(
                        "Groq usage — prompt_tokens=%s, completion_tokens=%s, "
                        "latency_ms=%.0f",
                        usage.get("prompt_tokens", "?"),
                        usage.get("completion_tokens", "?"),
                        latency,
                    )

                    raw_text: str = data["choices"][0]["message"]["content"]
                    try:
                        instance = schema.model_validate_json(raw_text)
                        logger.info(
                            "Groq structured output validated on attempt %d.", attempt
                        )
                        return instance
                    except (ValidationError, json.JSONDecodeError) as val_exc:
                        last_validation_error = str(val_exc)
                        logger.warning(
                            "Groq response failed validation (attempt %d): %s",
                            attempt,
                            last_validation_error[:300],
                        )
                        if attempt > repair_retries:
                            raise LLMError(
                                f"Groq response failed schema validation after "
                                f"{attempt} attempt(s): {last_validation_error}"
                            ) from val_exc

                except LLMError:
                    raise
                except httpx.HTTPStatusError as exc:
                    logger.warning(
                        "Groq HTTP error (attempt %d/%d): %s",
                        attempt,
                        self.MAX_ATTEMPTS,
                        exc,
                    )
                except Exception as exc:
                    logger.warning(
                        "Groq unexpected error (attempt %d/%d): %s",
                        attempt,
                        self.MAX_ATTEMPTS,
                        exc,
                    )

                if attempt < self.MAX_ATTEMPTS:
                    import random

                    wait = self.BASE_BACKOFF * (2 ** (attempt - 1)) + random.uniform(
                        0, 1.0
                    )
                    await asyncio.sleep(wait)

        raise LLMError(f"Groq failed after {self.MAX_ATTEMPTS} attempts.")


# ---------------------------------------------------------------------------
# Multi-provider client (primary → fallback → heuristic)
# ---------------------------------------------------------------------------
class MultiProviderLLMClient:
    """
    Orchestrates the provider fallback chain:
      Gemini Flash  →  Groq  →  (signal to caller to use heuristic fallback)

    Daily-quota thresholds are read from config and tracked in Redis.
    Switches proactively at 90% of the daily cap, not on first 429.
    """

    _QUOTA_SWITCH_THRESHOLD = 0.90  # switch provider at 90% of daily cap

    def __init__(self) -> None:
        self._gemini = GeminiLLMClient()
        self._groq = GroqLLMClient()
        self._gemini_rpd: int = getattr(settings, "GEMINI_FREE_TIER_RPD", 1500)
        self._groq_rpd: int = getattr(settings, "GROQ_FREE_TIER_RPD", 1000)

    def _gemini_quota_ok(self) -> bool:
        count = _get_daily_count("gemini")
        threshold = int(self._gemini_rpd * self._QUOTA_SWITCH_THRESHOLD)
        ok = count < threshold
        if not ok:
            logger.warning(
                "Gemini daily count %d ≥ threshold %d; routing to Groq.",
                count,
                threshold,
            )
        return ok

    def _groq_quota_ok(self) -> bool:
        count = _get_daily_count("groq")
        threshold = int(self._groq_rpd * self._QUOTA_SWITCH_THRESHOLD)
        ok = count < threshold
        if not ok:
            logger.warning(
                "Groq daily count %d ≥ threshold %d; both providers exhausted.",
                count,
                threshold,
            )
        return ok

    async def generate_structured(
        self,
        system: str,
        user: str,
        schema: Type[BaseModel],
        correlation_id: str | None = None,
    ) -> tuple[BaseModel, str]:
        """
        Try Gemini, then Groq, then signal heuristic fallback.

        Returns
        -------
        (validated_model_instance, provider_key)
        Raises ``HeuristicFallbackSignal`` if both providers fail.
        """
        log_prefix = f"[{correlation_id}]" if correlation_id else ""

        primary_provider = getattr(settings, "FEEDBACK_LLM_PRIMARY_PROVIDER", "gemini")
        fallback_provider = getattr(settings, "FEEDBACK_LLM_FALLBACK_PROVIDER", "groq")

        providers_to_try: list[tuple[str, LLMClient, bool]] = []

        if primary_provider == "gemini":
            providers_to_try.append(("gemini", self._gemini, self._gemini_quota_ok()))
            providers_to_try.append(("groq", self._groq, self._groq_quota_ok()))
        else:
            providers_to_try.append(("groq", self._groq, self._groq_quota_ok()))
            providers_to_try.append(("gemini", self._gemini, self._gemini_quota_ok()))

        for provider_name, client, quota_ok in providers_to_try:
            if not quota_ok:
                logger.info(
                    "%s Skipping %s (daily quota threshold reached).",
                    log_prefix,
                    provider_name,
                )
                continue

            repair_retries = 1 if provider_name == "gemini" else 2
            try:
                logger.info(
                    "%s Calling %s (repair_retries=%d).",
                    log_prefix,
                    provider_name,
                    repair_retries,
                )
                result = await client.generate_structured(
                    system, user, schema, repair_retries=repair_retries
                )
                return result, client.provider_key
            except LLMError as exc:
                logger.warning(
                    "%s %s failed: %s. Trying next provider.",
                    log_prefix,
                    provider_name,
                    exc,
                )
            except Exception as exc:
                logger.error(
                    "%s Unexpected error from %s: %s",
                    log_prefix,
                    provider_name,
                    exc,
                )

        # Both providers failed — signal heuristic fallback
        raise HeuristicFallbackSignal(
            "All LLM providers exhausted or quota-limited. "
            "Falling back to heuristic generator."
        )


class HeuristicFallbackSignal(Exception):
    """
    Raised by MultiProviderLLMClient when all providers are unavailable.
    The generator catches this and calls generate_heuristic_feedback().
    """


# ---------------------------------------------------------------------------
# Module-level singleton factory
# ---------------------------------------------------------------------------
_client_instance: MultiProviderLLMClient | None = None


def get_llm_client() -> MultiProviderLLMClient:
    """Return (or lazily create) the shared MultiProviderLLMClient."""
    global _client_instance
    if _client_instance is None:
        _client_instance = MultiProviderLLMClient()
    return _client_instance
