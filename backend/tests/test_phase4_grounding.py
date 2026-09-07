"""Tests for Phase 4: Grounding Contract and Numeric Verifier."""

import pytest
from app.llm.schemas.grounding import GroundingDTO, TimeWindow, DatasetMetrics
from app.llm.grounding.verifier import verify_numeric_grounding
from app.llm.testing.fixtures.stubs import get_canonical_grounding_fixture


def test_grounding_dto_validation():
    """Verify GroundingDTO parses canonical fields correctly and bounds evidence."""
    dto = get_canonical_grounding_fixture()
    assert dto.dataset_id == "demo-dataset-uuid-123"
    assert dto.metrics.total_feedback == 5000
    assert dto.metrics.negative_percent == 34.2
    assert len(dto.insights) == 2
    assert dto.is_sufficient_for_summary() is True


def test_insufficient_grounding_detection():
    """Verify that empty/zero feedback is detected as insufficient."""
    empty_dto = GroundingDTO(
        dataset_id="empty-dataset",
        time_window=TimeWindow(start="2026-08-01T00:00:00Z", end="2026-08-31T23:59:59Z"),
        metrics=DatasetMetrics(total_feedback=0, negative_percent=0.0),
        insights=[],
        evidence=[],
    )
    assert empty_dto.is_sufficient_for_summary() is False


def test_numeric_grounding_verifier_valid_text():
    """Verify text containing only grounded numbers passes the verifier."""
    dto = get_canonical_grounding_fixture()
    grounded_text = (
        "Out of 5000 total feedback submissions, negative feedback accounts for 34.2%. "
        "The leading issue is Wi-Fi with 248 complaints, up 31% over the prior period, "
        "carrying a priority score of 82."
    )
    is_grounded, ungrounded = verify_numeric_grounding(grounded_text, dto)
    assert is_grounded is True
    assert ungrounded == []


def test_numeric_grounding_verifier_flags_hallucinations():
    """Verify text containing invented metrics is caught by the verifier."""
    dto = get_canonical_grounding_fixture()
    hallucinated_text = (
        "There are 9845 complaints about cafeteria food and 99.4% of students are furious. "
        "Overall satisfaction decreased by 45.7%."
    )
    is_grounded, ungrounded = verify_numeric_grounding(hallucinated_text, dto)
    assert is_grounded is False
    assert len(ungrounded) >= 2
    assert 9845.0 in ungrounded or 99.4 in ungrounded
