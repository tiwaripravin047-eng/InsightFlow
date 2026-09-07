"""Tests for Phase 11: Caching / Performance."""

import pytest
from app.llm.caching.cache_manager import LLMCacheManager
from app.llm.testing.fixtures.stubs import get_canonical_grounding_fixture


def test_cache_key_generation_and_hash_sensitivity():
    """Verify cache key incorporates grounding hash and changes when facts change."""
    cache = LLMCacheManager(redis_url="redis://dummy:6379/9")
    dto1 = get_canonical_grounding_fixture("dataset-abc")
    dto2 = get_canonical_grounding_fixture("dataset-abc")

    key1 = cache.build_cache_key("dataset-abc", "executive_summary", dto1)
    key2 = cache.build_cache_key("dataset-abc", "executive_summary", dto2)
    assert key1 == key2

    # Change an underlying fact (e.g. negative percentage increases)
    dto2.metrics.negative_percent = 45.0
    key3 = cache.build_cache_key("dataset-abc", "executive_summary", dto2)

    # Key must differ to prevent serving stale output after analytics change
    assert key1 != key3


def test_cache_set_get_and_invalidation():
    """Verify in-memory cache operations and dataset invalidation."""
    cache = LLMCacheManager(redis_url="redis://dummy:6379/9")
    dto = get_canonical_grounding_fixture("ds-01")
    key = cache.build_cache_key("ds-01", "summary", dto)

    # Cache miss
    assert cache.get(key) is None
    assert cache.misses == 1

    # Cache set & hit
    cache.set(key, '{"summary": "cached summary"}')
    cached_val = cache.get(key)
    assert cached_val == '{"summary": "cached summary"}'
    assert cache.hits == 1

    # Invalidation on insight regeneration
    cache.invalidate_dataset("ds-01")
    assert cache.get(key) is None
