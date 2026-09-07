"""Numeric Hallucination Guard and Grounding Verifier.

Enforces Golden Rule:
DETERMINISTIC DATA -> ANALYTICS -> STRUCTURED FACTS -> LLM -> HUMAN-READABLE TEXT
Never the reverse. The LLM explains facts; it never computes, estimates, rounds, or invents them.
"""

import re
from typing import List, Set, Tuple
from app.llm.schemas.grounding import GroundingDTO


def extract_numbers_from_text(text: str) -> List[float]:
    """Extract numeric values (integers, floats, percentages) from natural text.

    Excludes years (e.g., 2026), ISO dates, or markdown header indicators.
    """
    cleaned = re.sub(r"\b202\d\b", "", text)  # remove year 2024-2029
    cleaned = re.sub(r"\b\d{4}-\d{2}-\d{2}\b", "", cleaned)  # remove ISO dates
    cleaned = re.sub(r"#+\s*", "", cleaned)  # remove header marks

    # Find float or integer numbers with optional percentage or decimal
    matches = re.findall(r"(?<![a-zA-Z_\-])(\d+(?:\.\d+)?)(%|\b)", cleaned)

    numbers = []
    for num_str, _ in matches:
        try:
            val = float(num_str)
            numbers.append(val)
        except ValueError:
            continue
    return numbers


def extract_allowed_numbers_from_dto(dto: GroundingDTO) -> Set[float]:
    """Collect all valid numeric values present in the GroundingDTO."""
    allowed: Set[float] = set()

    # Metrics
    allowed.add(float(dto.metrics.total_feedback))
    allowed.add(float(dto.metrics.negative_percent))
    allowed.add(round(float(dto.metrics.negative_percent)))
    if dto.metrics.positive_percent is not None:
        allowed.add(float(dto.metrics.positive_percent))
        allowed.add(round(float(dto.metrics.positive_percent)))
    if dto.metrics.neutral_percent is not None:
        allowed.add(float(dto.metrics.neutral_percent))
        allowed.add(round(float(dto.metrics.neutral_percent)))

    # Insights
    for ins in dto.insights:
        allowed.add(float(ins.volume))
        allowed.add(float(ins.change_percent))
        allowed.add(abs(float(ins.change_percent)))
        allowed.add(round(float(ins.change_percent)))
        allowed.add(float(ins.priority_score))
        allowed.add(float(ins.confidence))
        allowed.add(round(float(ins.confidence) * 100))  # e.g., 0.74 -> 74%
        for d in ins.likely_drivers:
            allowed.add(float(d.correlation_strength))
            allowed.add(round(float(d.correlation_strength) * 100))

    # Allow harmless small structural counts (1, 2, 3, 4, 5) if they represent list/point counts
    allowed.update({1.0, 2.0, 3.0, 4.0, 5.0, len(dto.insights)})
    return allowed


def verify_numeric_grounding(text: str, dto: GroundingDTO) -> Tuple[bool, List[float]]:
    """Verify that every number mentioned in generated text traces to a grounded fact.

    Returns:
        (is_grounded, ungrounded_numbers)
    """
    found_numbers = extract_numbers_from_text(text)
    allowed_numbers = extract_allowed_numbers_from_dto(dto)

    ungrounded = []
    for num in found_numbers:
        # Check direct match or approximate float representation
        match = any(abs(num - allowed) < 0.05 for allowed in allowed_numbers)
        if not match:
            ungrounded.append(num)

    return (len(ungrounded) == 0, ungrounded)
