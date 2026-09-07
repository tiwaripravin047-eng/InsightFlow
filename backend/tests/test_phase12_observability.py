"""Tests for Phase 12: Observability & Telemetry."""

import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.llm.observability.metrics import LLMMetricsCollector, trace_llm_stage, llm_metrics


def test_metrics_collector_aggregation():
    """Verify recording and summarization of metrics."""
    collector = LLMMetricsCollector()

    collector.record_call(
        stage="executive_summary",
        provider="openai",
        model="gpt-4o-mini",
        latency_ms=120.5,
        status="ok",
        prompt_tokens=150,
        completion_tokens=40,
    )

    collector.record_call(
        stage="topic_naming",
        provider="openai",
        model="gpt-4o-mini",
        latency_ms=80.0,
        status="unavailable",
    )

    summary = collector.get_summary()
    assert summary["requests_total"] == 2
    assert summary["requests_success"] == 1
    assert summary["requests_failed"] == 1
    assert summary["total_prompt_tokens"] == 150
    assert summary["total_completion_tokens"] == 40
    assert summary["average_latency_ms"] == 100.25
    assert summary["stage_breakdown"]["executive_summary"] == 1
    assert summary["stage_breakdown"]["topic_naming"] == 1


@pytest.mark.anyio
async def test_trace_llm_stage_context_manager():
    """Verify trace_llm_stage measures latency and logs stage completion."""
    async with trace_llm_stage(
        stage="test_trace",
        dataset_id="ds-test",
        provider="local",
        model="llama3",
    ):
        await asyncio.sleep(0.01)

    summary = llm_metrics.get_summary()
    assert summary["requests_total"] >= 1
    assert summary["stage_breakdown"].get("test_trace", 0) >= 1


def test_prometheus_endpoint():
    """Verify /metrics endpoint returns standard prometheus text output."""
    client = TestClient(app)
    res = client.get("/metrics")
    assert res.status_code == 200
    text = res.text
    assert "fios_llm_requests_total" in text
    assert "fios_llm_requests_success" in text
    assert "fios_llm_cache_hits" in text
