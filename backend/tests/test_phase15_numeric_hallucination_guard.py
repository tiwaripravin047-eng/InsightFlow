"""Tests for Phase 15: Dedicated Numeric Hallucination Guard.

First-class test category asserting that the LLM cannot introduce any number
absent from the Grounding DTO.
"""

import pytest
from app.llm.schemas.grounding import GroundingDTO
from app.llm.grounding.verifier import verify_numeric_grounding
from app.llm.testing.fixtures.stubs import get_canonical_grounding_fixture


def test_strictly_grounded_text_passes_guard():
    """Verify that text citing only valid numbers in GroundingDTO passes."""
    dto = get_canonical_grounding_fixture()
    # Allowed numbers from fixture: 5000, 34.2, 42.5, 23.3, 248, 31.0, 82, 0.74 (74), 214, 37.0, 87, 0.79 (79)
    valid_text = (
        "Out of 5000 feedback entries, 34.2% were negative. "
        "The primary topic was Wi-Fi with 248 mentions (up 31.0%) with priority score 82, "
        "followed by Food Quality with 214 mentions (up 37.0%) with priority score 87."
    )
    is_grounded, ungrounded = verify_numeric_grounding(valid_text, dto)
    assert is_grounded is True
    assert ungrounded == []


@pytest.mark.parametrize(
    "adversarial_text,expected_fake_number",
    [
        ("Satisfaction rating dropped to 15.8% across campus.", 15.8),
        ("Over 9500 students signed the petition regarding internet quality.", 9500.0),
        ("Wait times at the cafeteria increased by 44.5% this month.", 44.5),
        ("Wi-Fi complaints reached 9999 mentions yesterday.", 9999.0),
        ("About 67% of hostel residents reported leaking faucets.", 67.0),
        ("The administration resolved 1200 complaints in 48 hours.", 1200.0),
    ],
)
def test_adversarial_invented_metrics_rejected(adversarial_text, expected_fake_number):
    """Verify any hallucinated or fabricated statistic is caught by the guard."""
    dto = get_canonical_grounding_fixture()
    is_grounded, ungrounded = verify_numeric_grounding(adversarial_text, dto)
    assert is_grounded is False
    assert any(abs(num - expected_fake_number) < 0.1 for num in ungrounded)


def test_rounded_percentage_acceptance():
    """Verify standard rounding of valid percentages (e.g. 34% for 34.2%) is accepted."""
    dto = get_canonical_grounding_fixture()
    rounded_text = "Negative feedback stands at approximately 34% of the 5000 responses."
    is_grounded, ungrounded = verify_numeric_grounding(rounded_text, dto)
    assert is_grounded is True
    assert ungrounded == []
