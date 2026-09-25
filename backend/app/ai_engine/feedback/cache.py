"""
feedback/cache.py
=================
Persistent feedback cache backed by Redis.

Cache key
---------
SHA-256 of:
  "{provider_key}:{code_content_hash}:{report_content_hash}:{metrics_json}:{PROMPT_VERSION}"

The provider_key includes both provider name and model (e.g. "gemini:gemini-2.5-flash"),
so a Gemini-generated response and a Groq-generated response for the same submission
never collide.

The code/report content hashes mean two submissions with identical *scores* but
different actual code get different cache keys (fixing the old implementation's bug).

Fallback
--------
``NoOpFeedbackCache`` is used when Redis is unavailable — always a miss, never crashes.
"""

from __future__ import annotations

import hashlib
import json
import logging
from abc import ABC, abstractmethod
from typing import Any, Optional

from .models import FeedbackResult
from .prompt_builder import PROMPT_VERSION

logger = logging.getLogger(__name__)

_CACHE_KEY_PREFIX = "feedback:v1:"
_DEFAULT_TTL = 7 * 24 * 3600  # 7 days


# ---------------------------------------------------------------------------
# Abstract interface
# ---------------------------------------------------------------------------
class FeedbackCache(ABC):
    @abstractmethod
    async def get(self, key: str) -> Optional[FeedbackResult]:
        """Return cached result or None on miss."""

    @abstractmethod
    async def set(self, key: str, value: FeedbackResult, ttl: int = _DEFAULT_TTL) -> None:
        """Store a result with given TTL in seconds."""

    @staticmethod
    def make_key(
        provider_key: str,
        code_content_hash: str,
        report_content_hash: str,
        metrics: dict[str, Any],
        prompt_version: str = PROMPT_VERSION,
    ) -> str:
        """
        Build a cache key that uniquely identifies the combination of:
          - LLM provider + model
          - Actual code content (not just scores)
          - Actual report content
          - All upstream metrics
          - Prompt template version

        Two submissions with identical scores but different code → different keys.
        """
        metrics_str = json.dumps(metrics, sort_keys=True, default=str)
        raw = (
            f"{provider_key}:"
            f"{code_content_hash}:"
            f"{report_content_hash}:"
            f"{metrics_str}:"
            f"{prompt_version}"
        )
        digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        return f"{_CACHE_KEY_PREFIX}{digest}"


# ---------------------------------------------------------------------------
# Redis implementation
# ---------------------------------------------------------------------------
class RedisFeedbackCache(FeedbackCache):
    """
    Stores serialised FeedbackResult JSON in Redis.

    Uses redis.asyncio (already in requirements.txt via the ``redis`` package
    with extras).
    """

    def __init__(self, redis_url: str, db: int = 2) -> None:
        self._redis_url = redis_url
        self._db = db
        self._client: Any = None

    async def _get_client(self) -> Any:
        if self._client is not None:
            return self._client
        try:
            from redis.asyncio import Redis  # type: ignore

            self._client = Redis.from_url(
                self._redis_url,
                db=self._db,
                decode_responses=True,
                socket_connect_timeout=2,
            )
            await self._client.ping()
            logger.debug("FeedbackCache Redis connected (db=%d).", self._db)
        except Exception as exc:
            logger.warning(
                "FeedbackCache: Redis unavailable (%s). Returning NoOp cache.", exc
            )
            self._client = None
        return self._client

    async def get(self, key: str) -> Optional[FeedbackResult]:
        client = await self._get_client()
        if client is None:
            return None
        try:
            raw = await client.get(key)
            if raw is None:
                return None
            result = FeedbackResult.model_validate_json(raw)
            logger.info("Cache HIT for key %s…", key[-12:])
            return result
        except Exception as exc:
            logger.warning("Cache GET error for key %s: %s", key[-12:], exc)
            return None

    async def set(
        self, key: str, value: FeedbackResult, ttl: int = _DEFAULT_TTL
    ) -> None:
        client = await self._get_client()
        if client is None:
            return
        try:
            serialised = value.model_dump_json()
            await client.setex(key, ttl, serialised)
            logger.info(
                "Cache SET for key %s… (TTL=%ds)", key[-12:], ttl
            )
        except Exception as exc:
            logger.warning("Cache SET error for key %s: %s", key[-12:], exc)


# ---------------------------------------------------------------------------
# No-op fallback
# ---------------------------------------------------------------------------
class NoOpFeedbackCache(FeedbackCache):
    """Always misses; used when Redis is unavailable at startup."""

    async def get(self, key: str) -> Optional[FeedbackResult]:
        return None

    async def set(
        self, key: str, value: FeedbackResult, ttl: int = _DEFAULT_TTL
    ) -> None:
        pass  # silently discard


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------
def get_feedback_cache() -> FeedbackCache:
    """
    Return a RedisFeedbackCache if Redis is configured, otherwise NoOpFeedbackCache.
    """
    from app.config import settings  # local import to avoid circular

    redis_url = getattr(settings, "REDIS_URL", None)
    if redis_url:
        return RedisFeedbackCache(redis_url=redis_url, db=2)
    logger.warning("REDIS_URL not configured; feedback cache disabled.")
    return NoOpFeedbackCache()


# ---------------------------------------------------------------------------
# Content hash helpers
# ---------------------------------------------------------------------------
def hash_content(text: str) -> str:
    """Return a SHA-256 hex digest of the given text."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()
