"""Tests for Phase 7: Action Recommendation Phrasing."""

import pytest
import json
from app.llm.providers.base import LLMResult, LLMProvider
from app.llm.schemas.action import ActionContext
from app.llm.services.action_recommendation import (
    generate_action_recommendation,
    generate_deterministic_recommendation,
)


class MockLLM(LLMProvider):
    def __init__(self, result: LLMResult):
        self.result = result

    async def generate(self, prompt, *, system_prompt=None, temperature=None, max_tokens=None):
        return self.result


@pytest.mark.anyio
async def test_valid_action_recommendation_generation():
    """Verify grounded recommendation phrasing and mandatory AI-suggested label."""
    context = ActionContext(
        issue_id="issue-wifi-001",
        topic="Wi-Fi",
        severity="high",
        priority_score=82,
        affected_categories=["Hostel", "Library"],
        likely_drivers=["Router Overload"],
        evidence_samples=["wifi drops every 10 min in library"],
    )
    mock_json = {
        "recommendation": "Review Wi-Fi access-point reliability in the affected areas, as network instability is strongly associated with recent negative feedback.",
        "suggested_focus": "Hostel",
    }
    mock_provider = MockLLM(LLMResult(status="ok", text=json.dumps(mock_json)))
    res = await generate_action_recommendation(context, mock_provider)

    assert res.issue_id == "issue-wifi-001"
    assert res.label == "AI-suggested"
    assert "associated with" in res.recommendation.lower()
    assert res.is_causal_free is True
    assert res.source == "llm"


@pytest.mark.anyio
async def test_causal_language_in_recommendation_is_sanitized():
    """Verify causal claims like 'caused by' are sanitized to correlational phrasing."""
    context = ActionContext(
        issue_id="issue-food-002",
        topic="Food Quality",
        severity="critical",
        priority_score=87,
        affected_categories=["Cafeteria"],
        likely_drivers=["Serving Temperature"],
        evidence_samples=["Food cold by 7pm"],
    )
    mock_json = {
        "recommendation": "Inspect warmers because cold meals caused by delivery delays are unacceptable.",
        "suggested_focus": "Cafeteria",
    }
    mock_provider = MockLLM(LLMResult(status="ok", text=json.dumps(mock_json)))
    res = await generate_action_recommendation(context, mock_provider)

    assert "caused by" not in res.recommendation.lower()
    assert "caused" not in res.recommendation.lower()
    assert "likely linked to" in res.recommendation.lower() or "associated" in res.recommendation.lower()


@pytest.mark.anyio
async def test_invented_budget_triggers_deterministic_fallback():
    """Verify invented budget figures ($50,000) are caught and rejected."""
    context = ActionContext(
        issue_id="issue-003",
        topic="Wi-Fi",
        severity="medium",
        priority_score=50,
        affected_categories=["Library"],
        likely_drivers=[],
        evidence_samples=[],
    )
    mock_json = {
        "recommendation": "Allocate $50,000 to replace all routers immediately.",
        "suggested_focus": "Library",
    }
    mock_provider = MockLLM(LLMResult(status="ok", text=json.dumps(mock_json)))
    res = await generate_action_recommendation(context, mock_provider)

    assert res.source == "deterministic_fallback"
    assert "$50,000" not in res.recommendation
    assert res.label == "AI-suggested"


def test_deterministic_action_recommendation_fallback():
    """Verify deterministic fallback produces actionable non-causal recommendation."""
    context = ActionContext(
        issue_id="issue-004",
        topic="Plumbing",
        severity="high",
        priority_score=75,
        affected_categories=["Hostel Block A"],
        likely_drivers=["Old Pipe Valves"],
        evidence_samples=[],
    )
    res = generate_deterministic_recommendation(context)
    assert res.label == "AI-suggested"
    assert "Plumbing" in res.recommendation
    assert "Hostel Block A" in res.recommendation
    assert res.is_causal_free is True
