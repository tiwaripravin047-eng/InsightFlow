"""Observability and Metrics for LLM Operations.

Enforces Phase 12 requirements:
- Structured telemetry without leaking sensitive credentials or raw text
- Latency tracking, request/failure counts, token metrics, cache hits/misses
- Prometheus text export and structured JSON summary
"""

import time
from typing import Any, Dict, List, Optional
from contextlib import asynccontextmanager
import structlog
from app.core.logging import logger
from app.llm.caching.cache_manager import llm_cache


class LLMMetricsCollector:
    """In-memory metrics accumulator for LLM & pipeline stages."""

    def __init__(self):
        self.requests_total = 0
        self.requests_success = 0
        self.requests_failed = 0
        self.total_latency_ms = 0.0
        self.total_prompt_tokens = 0
        self.total_completion_tokens = 0
        self.stage_counts: Dict[str, int] = {}
        self.provider_counts: Dict[str, int] = {}

    def record_call(
        self,
        stage: str,
        provider: str,
        model: str,
        latency_ms: float,
        status: str,
        prompt_tokens: Optional[int] = None,
        completion_tokens: Optional[int] = None,
    ):
        self.requests_total += 1
        if status == "ok":
            self.requests_success += 1
        else:
            self.requests_failed += 1

        self.total_latency_ms += latency_ms
        if prompt_tokens:
            self.total_prompt_tokens += prompt_tokens
        if completion_tokens:
            self.total_completion_tokens += completion_tokens

        self.stage_counts[stage] = self.stage_counts.get(stage, 0) + 1
        self.provider_counts[provider] = self.provider_counts.get(provider, 0) + 1

    def get_summary(self) -> Dict[str, Any]:
        avg_latency = (
            round(self.total_latency_ms / self.requests_total, 2)
            if self.requests_total > 0
            else 0.0
        )
        return {
            "requests_total": self.requests_total,
            "requests_success": self.requests_success,
            "requests_failed": self.requests_failed,
            "average_latency_ms": avg_latency,
            "total_prompt_tokens": self.total_prompt_tokens,
            "total_completion_tokens": self.total_completion_tokens,
            "stage_breakdown": self.stage_counts,
            "provider_breakdown": self.provider_counts,
            "cache_hits": llm_cache.hits,
            "cache_misses": llm_cache.misses,
        }

    def export_prometheus(self) -> str:
        """Generate Prometheus exposition text format."""
        summary = self.get_summary()
        lines = [
            "# HELP fios_llm_requests_total Total number of LLM requests",
            "# TYPE fios_llm_requests_total counter",
            f"fios_llm_requests_total {summary['requests_total']}",
            "# HELP fios_llm_requests_success Total successful LLM requests",
            "# TYPE fios_llm_requests_success counter",
            f"fios_llm_requests_success {summary['requests_success']}",
            "# HELP fios_llm_requests_failed Total failed LLM requests",
            "# TYPE fios_llm_requests_failed counter",
            f"fios_llm_requests_failed {summary['requests_failed']}",
            "# HELP fios_llm_avg_latency_ms Average LLM latency in milliseconds",
            "# TYPE fios_llm_avg_latency_ms gauge",
            f"fios_llm_avg_latency_ms {summary['average_latency_ms']}",
            "# HELP fios_llm_cache_hits Total LLM cache hits",
            "# TYPE fios_llm_cache_hits counter",
            f"fios_llm_cache_hits {summary['cache_hits']}",
            "# HELP fios_llm_cache_misses Total LLM cache misses",
            "# TYPE fios_llm_cache_misses counter",
            f"fios_llm_cache_misses {summary['cache_misses']}",
        ]
        return "\n".join(lines) + "\n"


llm_metrics = LLMMetricsCollector()


@asynccontextmanager
async def trace_llm_stage(
    stage: str,
    dataset_id: Optional[str] = None,
    job_id: Optional[str] = None,
    provider: str = "unknown",
    model: str = "unknown",
):
    """Async context manager to trace and log an LLM execution stage."""
    start_time = time.perf_counter()
    status = "ok"
    error_msg = None

    try:
        yield
    except Exception as exc:
        status = "failed"
        error_msg = str(exc)
        raise
    finally:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        llm_metrics.record_call(
            stage=stage,
            provider=provider,
            model=model,
            latency_ms=elapsed_ms,
            status=status,
        )
        logger.info(
            "LLM stage completed",
            stage=stage,
            dataset_id=dataset_id,
            job_id=job_id,
            provider=provider,
            model=model,
            latency_ms=elapsed_ms,
            status=status,
            error=error_msg,
        )
