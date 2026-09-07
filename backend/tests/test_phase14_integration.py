"""Tests for Phase 14: End-to-End Integration with Real 5,000-row Dataset."""

import pytest
from app.core.config import settings
from app.llm.services.integration_pipeline import (
    compute_real_dataset_facts,
    run_end_to_end_integration,
)


def test_stub_flag_disabled_by_default():
    """Verify USE_ANALYTICS_STUB defaults to False per Section 2 stub policy."""
    assert settings.USE_ANALYTICS_STUB is False


def test_real_dataset_aggregation():
    """Verify compute_real_dataset_facts runs against data/demo_feedback.csv and produces real facts."""
    dto = compute_real_dataset_facts("data/demo_feedback.csv")
    assert dto.metrics.total_feedback == 5000
    assert dto.metrics.negative_percent > 0.0
    assert len(dto.insights) == 2
    assert dto.insights[0].topic == "Wi-Fi Reliability"
    assert dto.insights[0].volume > 0
    # Confirm evidence contains actual row feedback text
    assert len(dto.evidence) > 0
    assert len(dto.evidence[0].feedback_id) > 10


@pytest.mark.anyio
async def test_full_pipeline_end_to_end():
    """Verify complete end-to-end flow executes seamlessly on real 5,000-row data."""
    report = await run_end_to_end_integration()
    assert report["status"] == "success"
    assert report["dataset_rows"] == 5000
    assert len(report["summary"]) > 20
    assert len(report["topic"]) > 2
    assert "AI-suggested" in report["action"] or len(report["action"]) > 20
    assert report["evidence_citations"] > 0


def test_api_summary_and_action_endpoints():
    """Verify GET /api/v1/datasets/{id}/summary and /issues/{id}/recommend-action."""
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)

    # 1. Test Summary
    res_summary = client.get("/api/v1/datasets/demo-5000/summary")
    assert res_summary.status_code == 200
    data = res_summary.json()
    assert "data" in data
    assert "summary" in data["data"]
    assert "key_points" in data["data"]
    assert data["data"]["is_grounded"] is True

    # 2. Test cached response
    res_cached = client.get("/api/v1/datasets/demo-5000/summary")
    assert res_cached.status_code == 200
    assert res_cached.json()["meta"]["cached"] is True

    # 3. Test Action Recommendation
    res_action = client.get("/api/v1/issues/issue-wifi-001/recommend-action")
    assert res_action.status_code == 200
    action_data = res_action.json()["data"]
    assert action_data["label"] == "AI-suggested"
    assert action_data["is_causal_free"] is True
    assert len(action_data["recommendation"]) > 10

