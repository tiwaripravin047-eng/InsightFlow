"""Caching layer for LLM outputs.

Enforces Phase 11 rules:
- Cache key incorporates dataset_id, feature, model, prompt_version, and a SHA-256 hash of the grounding DTO content.
- Stale fact prevention: If any underlying fact changes, grounding_hash changes and invalidates cache.
- Invalidation on insight regeneration.
- Supports Redis with graceful local in-memory fallback.
"""

import hashlib
import json
from typing import Any, Dict, Optional
import redis
from app.core.config import settings
from app.core.logging import logger

PROMPT_VERSION = "v1.0"


class LLMCacheManager:
    """Manages caching and invalidation of LLM-generated explanations."""

    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url or settings.REDIS_URL
        self._redis_client: Optional[redis.Redis] = None
        self._memory_cache: Dict[str, str] = {}
        self.hits = 0
        self.misses = 0

    def _get_redis(self) -> Optional[redis.Redis]:
        if self._redis_client is None:
            if not self.redis_url or "dummy" in self.redis_url:
                return None
            try:
                r = redis.from_url(self.redis_url, socket_connect_timeout=0.2)
                r.ping()
                self._redis_client = r
            except Exception:
                self._redis_client = None
        return self._redis_client

    @staticmethod
    def compute_grounding_hash(grounding_data: Any) -> str:
        """Compute SHA-256 hash of grounding facts to invalidate on fact changes."""
        if hasattr(grounding_data, "model_dump"):
            serialized = json.dumps(grounding_data.model_dump(), sort_keys=True)
        elif isinstance(grounding_data, dict):
            serialized = json.dumps(grounding_data, sort_keys=True)
        else:
            serialized = str(grounding_data)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:16]

    def build_cache_key(
        self,
        dataset_id: str,
        stage: str,
        grounding_data: Any,
        model: Optional[str] = None,
        provider: Optional[str] = None,
    ) -> str:
        """Generate deterministic cache key with content hashing."""
        ghash = self.compute_grounding_hash(grounding_data)
        m = model or settings.LLM_MODEL
        p = provider or settings.LLM_PROVIDER
        return f"fios:llm:{dataset_id}:{stage}:{p}:{m}:{PROMPT_VERSION}:{ghash}"

    def get(self, key: str) -> Optional[str]:
        """Retrieve cached output if available."""
        r = self._get_redis()
        if r:
            try:
                val = r.get(key)
                if val:
                    self.hits += 1
                    return val.decode("utf-8") if isinstance(val, bytes) else str(val)
            except Exception as exc:
                logger.warning("Redis cache get error", error=str(exc))

        # Memory cache fallback
        if key in self._memory_cache:
            self.hits += 1
            return self._memory_cache[key]

        self.misses += 1
        return None

    def set(self, key: str, value: str, ttl_seconds: int = 86400):
        """Store output in cache with TTL (default 24h)."""
        r = self._get_redis()
        if r:
            try:
                r.setex(key, ttl_seconds, value)
                return
            except Exception as exc:
                logger.warning("Redis cache set error", error=str(exc))

        # Memory cache fallback
        self._memory_cache[key] = value

    def invalidate_dataset(self, dataset_id: str):
        """Invalidate all cached LLM responses for a given dataset."""
        pattern = f"fios:llm:{dataset_id}:*"
        r = self._get_redis()
        if r:
            try:
                keys = r.keys(pattern)
                if keys:
                    r.delete(*keys)
            except Exception as exc:
                logger.warning("Redis cache invalidation error", error=str(exc))

        # Also purge from in-memory fallback
        prefix = f"fios:llm:{dataset_id}:"
        to_delete = [k for k in self._memory_cache if k.startswith(prefix)]
        for k in to_delete:
            del self._memory_cache[k]


llm_cache = LLMCacheManager()
