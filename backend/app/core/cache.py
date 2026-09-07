"""Redis caching layer for dashboard aggregates and query results."""
import json
import hashlib
from typing import Any, Optional
import redis
from app.core.config import get_settings
from app.core.logging import logger


class CacheManager:
    """Manages aggregate result caching with deterministic hash keys."""
    def __init__(self):
        settings = get_settings()
        try:
            # Use protocol=2 to ensure compatibility across Redis 5, 6, and 7
            self.client: Optional[redis.Redis] = redis.from_url(
                settings.REDIS_URL,
                protocol=settings.REDIS_PROTOCOL,
                decode_responses=True,
                socket_timeout=3,
            )
            # Test connection
            self.client.ping()
            self.available = True
        except Exception as exc:
            logger.warning("redis_cache_unavailable", error=str(exc))
            self.client = None
            self.available = False

    @staticmethod
    def generate_key(dataset_id: str, prefix: str, **params: Any) -> str:
        """Generate a deterministic cache key from dataset_id, prefix, and sorted params."""
        sorted_params = sorted([(k, str(v)) for k, v in params.items() if v is not None])
        raw_str = f"{dataset_id}:{prefix}:" + "&".join(f"{k}={v}" for k, v in sorted_params)
        filter_hash = hashlib.sha256(raw_str.encode("utf-8")).hexdigest()[:16]
        return f"cache:{dataset_id}:{prefix}:{filter_hash}"

    def get(self, key: str) -> Optional[Any]:
        """Retrieve and parse JSON value from cache."""
        if not self.available or not self.client:
            return None
        try:
            val = self.client.get(key)
            if val:
                return json.loads(val)
        except Exception as exc:
            logger.warning("cache_get_error", key=key, error=str(exc))
        return None

    def set(self, key: str, value: Any, ttl_seconds: int = 3600) -> bool:
        """Store JSON serializable value in cache."""
        if not self.available or not self.client:
            return False
        try:
            serialized = json.dumps(value, default=str)
            self.client.setex(key, ttl_seconds, serialized)
            return True
        except Exception as exc:
            logger.warning("cache_set_error", key=key, error=str(exc))
            return False

    def invalidate_dataset(self, dataset_id: str) -> int:
        """Invalidate all cache entries associated with a dataset."""
        if not self.available or not self.client:
            return 0
        try:
            pattern = f"cache:{dataset_id}:*"
            keys = self.client.keys(pattern)
            if keys:
                return self.client.delete(*keys)
        except Exception as exc:
            logger.warning("cache_invalidation_error", dataset_id=dataset_id, error=str(exc))
        return 0


_cache_instance: Optional[CacheManager] = None


def get_cache() -> CacheManager:
    """Get singleton cache manager instance."""
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = CacheManager()
    return _cache_instance
