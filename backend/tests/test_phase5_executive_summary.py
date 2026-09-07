"""Tests for Phase 5: Executive Summary Generation."""

import pytest
import json
from unittest.mock import AsyncMock, patch
from app.llm.providers.base import LLMResult, LLMProvider
from app.llm.schemas.grounding import GroundingDTO, TimeWindow, DatasetMetrics
from app.llm.testing.fixtures.stubs import get_canonical_grounding_fixture
from app.llm.services.executive_summary import (
    generate_executive_summary,
    INSUFFICIENT_EVIDENCE_MSG,
    clean_causal_language,
)


class MockLLM(LLMProvider):
    def __init__(self, result: LLMResult):
        self.result = result

    async def generate(self, prompt, *, system_prompt=None, temperature=None, max_tokens=None):
        return self.result


@pytest.mark.anyio
async def test_insufficient_evidence_exact_fallback():
    """Verify exact fallback string when computed evidence is insufficient."""
    empty_dto = GroundingDTO(
        dataset_id="empty-dataset",
        time_window=TimeWindow(start="2026-08-01T00:00:00Z", end="2026-08-31T23:59:59Z"),
        metrics=DatasetMetrics(total_feedback=0, negative_percent=0.0),
        insights=[],
        evidence=[],
    )
    provider = MockLLM(LLMResult(status="ok", text="Some text"))
    res = await generate_executive_summary(empty_dto, provider)
    assert res.summary == INSUFFICIENT_EVIDENCE_MSG
    assert res.key_points == []


@pytest.mark.anyio
async def test_provider_unavailable_deterministic_fallback():
    """Verify graceful deterministic fallback when LLM is unavailable."""
    dto = get_canonical_grounding_fixture()
    provider = MockLLM(LLMResult(status="unavailable", reason="API rate limit exceeded"))
    res = await generate_executive_summary(dto, provider)
    assert res.source == "deterministic_fallback"
    assert "Wi-Fi" in res.summary or "5000" in res.summary
    assert len(res.key_points) > 0


@pytest.mark.anyio
async def test_valid_grounded_summary_generation():
    """Verify structured parsing and preservation of grounded data."""
    dto = get_canonical_grounding_fixture()
    mock_json = {
        "summary": "Negative feedback accounts for 34.2% of 5000 submissions. Wi-Fi instability appears linked to student dissatisfaction.",
        "key_points": [
            "Wi-Fi complaints rose by 31.0% with 248 mentions.",
            "Food Quality carried 214 mentions and a priority score of 87.",
        ],
        "attention_items": ["Review Wi-Fi coverage across Hostel and Library."],
    }
    provider = MockLLM(LLMResult(status="ok", text=f"```json\n{json.dumps(mock_json)}\n```"))
    res = await generate_executive_summary(dto, provider)
    assert res.source == "llm"
    assert res.is_grounded is True
    assert len(res.key_points) == 2
    assert "34.2%" in res.summary or "34.2" in res.summary


def test_banned_causal_phrasing_sanitization():
    """Verify causal words like 'caused' are replaced by correlation terms."""
    causal_sentence = "Router firmware definitely caused the Wi-Fi failures and caused high dissatisfaction."
    cleaned = clean_causal_language(causal_sentence)
    assert "definitely caused" not in cleaned
    assert "caused" not in cleaned
    assert "likely linked to" in cleaned


@pytest.mark.anyio
async def test_numeric_hallucination_triggers_safe_fallback():
    """Verify that hallucinated numbers from LLM trigger safe deterministic fallback."""
    dto = get_canonical_grounding_fixture()
    hallucinated_json = {
        "summary": "We had 19283 complaints and 99.8% of students are dissatisfied.",
        "key_points": ["Wi-Fi volume reached 8888 mentions."],
        "attention_items": ["Fix everything."],
    }
    provider = MockLLM(LLMResult(status="ok", text=json.dumps(hallucinated_json)))
    res = await generate_executive_summary(dto, provider)
    # Hallucinated numbers (19283, 99.8, 8888) should cause fallback to deterministic summary
    assert res.source == "deterministic_fallback"
    assert "19283" not in res.summary
    assert "5000" in res.summary
