"""Stub fixtures for parallel Track A / Track C development.

Adheres to Section 2 Stub Policy:
- Clearly labeled fixtures matching API_CONTRACTS.md shapes
- Gated by USE_ANALYTICS_STUB=true
- Never presented to user as real output without 'stub_data' indicator
"""

import uuid
from app.llm.schemas.grounding import GroundingDTO, TimeWindow, DatasetMetrics, GroundedInsightFact, EvidenceSample


def get_canonical_grounding_fixture(dataset_id: str = "demo-dataset-uuid-123") -> GroundingDTO:
    """Return a typed canonical GroundingDTO fixture matching API_CONTRACTS.md specs."""
    ins1_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{dataset_id}-insight-wifi"))
    ins2_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{dataset_id}-insight-food"))
    ev1_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{dataset_id}-evidence-wifi"))
    ev2_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{dataset_id}-evidence-food"))

    return GroundingDTO(
        dataset_id=dataset_id,
        time_window=TimeWindow(
            start="2026-08-01T00:00:00Z",
            end="2026-09-06T23:59:59Z",
        ),
        metrics=DatasetMetrics(
            total_feedback=5000,
            negative_percent=34.2,
            positive_percent=42.5,
            neutral_percent=23.3,
        ),
        insights=[
            GroundedInsightFact(
                insight_id=ins1_id,
                topic="Wi-Fi",
                volume=248,
                change_percent=31.0,
                sentiment="negative",
                severity="high",
                priority_score=82,
                confidence=0.74,
                affected_categories=["Hostel", "Library"],
                likely_drivers=[{"topic": "Router Overload", "correlation_strength": 0.62}],
            ),
            GroundedInsightFact(
                insight_id=ins2_id,
                topic="Food Quality",
                volume=214,
                change_percent=37.0,
                sentiment="negative",
                severity="high",
                priority_score=87,
                confidence=0.79,
                affected_categories=["Hostel", "Cafeteria"],
                likely_drivers=[{"topic": "Serving Temperature", "correlation_strength": 0.58}],
            ),
        ],
        evidence=[
            EvidenceSample(
                feedback_id=ev1_id,
                text="wifi keeps disconnecting in library every 10 minutes",
            ),
            EvidenceSample(
                feedback_id=ev2_id,
                text="food is cold every time by 7pm in hostel mess",
            ),
        ],
    )
