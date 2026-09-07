"""Tests for Phase 8 & Phase 9: Ask Feedback (NL Query Translation, Execution, Citations)."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.llm.schemas.query import QueryIntent
from app.llm.services.query_translator import match_deterministic_intent, translate_query_to_intent
from app.llm.services.ask_feedback import ask_feedback_query


def test_query_translation_classes():
    """Verify standard query classes translate to expected structured operations and filters."""
    # 1. What got worse this week?
    intent1 = match_deterministic_intent("What got worse this week?")
    assert intent1 is not None
    assert intent1.operation == "compare_periods"
    assert intent1.metric == "negative_feedback"
    assert intent1.period == "week_over_week"

    # 2. What improved?
    intent2 = match_deterministic_intent("What improved this week?")
    assert intent2 is not None
    assert intent2.operation == "compare_periods"
    assert intent2.metric == "positive_feedback"

    # 3. Emerging issues
    intent3 = match_deterministic_intent("Show emerging issues")
    assert intent3 is not None
    assert intent3.operation == "emerging_issues"

    # 4. Top issues / why unhappy
    intent4 = match_deterministic_intent("Why are students unhappy this month?")
    assert intent4 is not None
    assert intent4.operation == "top_issues"

    # 5. Topic search
    intent5 = match_deterministic_intent("Show negative feedback about Wi-Fi")
    assert intent5 is not None
    assert intent5.operation == "topic_search"
    assert "Wi-Fi" in intent5.filters.topic or "Wifi" in intent5.filters.topic

    # 6. Category breakdown
    intent6 = match_deterministic_intent("Which category is most affected?")
    assert intent6 is not None
    assert intent6.operation == "category_breakdown"

    # 7. Unsupported question
    intent7 = match_deterministic_intent("What is the capital of France?")
    assert intent7 is not None
    assert intent7.operation == "unsupported"


@pytest.mark.anyio
async def test_ask_feedback_grounded_execution_and_citations():
    """Verify end-to-end flow: question -> intent -> real aggregation -> citations."""
    res = await ask_feedback_query(
        dataset_id="demo-dataset-123",
        question="What got worse this week?",
        provider=None,  # Tests deterministic composer path
    )

    assert res.answerable is True
    assert "negative feedback" in res.answer.lower()
    # Citations
    assert len(res.evidence_feedback_ids) > 0
    # Confirm IDs are valid non-empty string IDs
    for fid in res.evidence_feedback_ids:
        assert isinstance(fid, str) and len(fid) > 10
    # Computed data present
    assert "change_percent" in res.computed_data
    assert "top_drivers" in res.computed_data
    assert "date_from" in res.filters_applied


@pytest.mark.anyio
async def test_ask_feedback_unanswerable_question():
    """Verify that unmappable questions return answerable=false and honest refusal."""
    res = await ask_feedback_query(
        dataset_id="demo-dataset-123",
        question="What is the weather in Delhi tomorrow?",
        provider=None,
    )
    assert res.answerable is False
    assert "can't answer" in res.answer.lower() or "not available" in res.answer.lower()
    assert res.evidence_feedback_ids == []


def test_api_endpoint_ask_feedback():
    """Verify POST /api/v1/datasets/{id}/query endpoint returns canonical envelope."""
    client = TestClient(app)
    payload = {"question": "What got worse this week?"}
    response = client.post("/api/v1/datasets/demo-123/query", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "meta" in data
    assert data["error"] is None

    res_data = data["data"]
    assert res_data["answerable"] is True
    assert "answer" in res_data
    assert "evidence_feedback_ids" in res_data
    assert "filters_applied" in res_data
