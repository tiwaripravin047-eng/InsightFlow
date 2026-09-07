"""Tests for Phase 6: Topic Naming Assist."""

import pytest
from app.llm.providers.base import LLMResult, LLMProvider
from app.llm.schemas.topic import ClusterContext
from app.llm.services.topic_naming import (
    generate_topic_label,
    generate_deterministic_label,
)


class MockLLM(LLMProvider):
    def __init__(self, result: LLMResult):
        self.result = result

    async def generate(self, prompt, *, system_prompt=None, temperature=None, max_tokens=None):
        return self.result


@pytest.mark.anyio
async def test_llm_topic_naming_success():
    """Verify successful LLM labeling with label_source='llm'."""
    context = ClusterContext(
        cluster_id="cluster-wifi-1",
        top_terms=["wifi", "disconnect", "signal", "router", "speed"],
        representative_samples=[
            "Wi-Fi keeps dropping connection in hostel block",
            "Terrible internet signal in library reading hall",
        ],
        cluster_size=180,
        coherence_score=0.82,
    )
    mock_provider = MockLLM(LLMResult(status="ok", text="Wi-Fi Reliability"))
    res = await generate_topic_label(context, mock_provider)

    assert res.cluster_id == "cluster-wifi-1"
    assert res.label == "Wi-Fi Reliability"
    assert res.label_source == "llm"
    assert res.confidence == 0.82


@pytest.mark.anyio
async def test_llm_unavailable_triggers_deterministic_fallback():
    """Verify deterministic fallback triggers when LLM is unavailable."""
    context = ClusterContext(
        cluster_id="cluster-food-2",
        top_terms=["cafeteria", "cold", "dinner", "mess"],
        representative_samples=["Food is served cold at 7pm"],
        cluster_size=95,
        coherence_score=0.71,
    )
    mock_provider = MockLLM(LLMResult(status="unavailable", reason="Service timeout"))
    res = await generate_topic_label(context, mock_provider)

    assert res.cluster_id == "cluster-food-2"
    assert res.label_source == "deterministic"
    assert "Cafeteria" in res.label
    assert res.confidence >= 0.5


def test_deterministic_fallback_label_generation():
    """Verify deterministic naming formats top terms cleanly."""
    context = ClusterContext(
        cluster_id="cluster-3",
        top_terms=["hostel", "plumbing", "water"],
        representative_samples=[],
        cluster_size=50,
        coherence_score=0.65,
    )
    res = generate_deterministic_label(context)
    assert res.label == "Hostel / Plumbing"
    assert res.label_source == "deterministic"


def test_empty_terms_fallback():
    """Verify empty terms produce safe general label."""
    context = ClusterContext(
        cluster_id="cluster-empty",
        top_terms=[],
        representative_samples=[],
        cluster_size=10,
        coherence_score=0.3,
    )
    res = generate_deterministic_label(context)
    assert res.label == "General Feedback"
    assert res.label_source == "deterministic"
