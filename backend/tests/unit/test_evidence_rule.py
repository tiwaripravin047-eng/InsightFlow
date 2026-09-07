"""Unit test enforcing the non-negotiable Evidence link rule."""
import uuid
import pytest
from app.core.errors import EvidenceRequiredError
from app.db.repositories.insight_repo import InsightRepository
from app.db.session import SessionLocal


def test_insight_creation_without_evidence_strictly_fails():
    """Verify that attempting to persist an Insight with empty evidence raises EvidenceRequiredError."""
    db = SessionLocal()
    try:
        repo = InsightRepository(db)
        with pytest.raises(EvidenceRequiredError):
            repo.create(
                dataset_id=uuid.uuid4(),
                title="Invalid Insight with No Evidence",
                sentiment="negative",
                severity="high",
                priority_score=85,
                priority_factors={},
                evidence_feedback_ids=[],  # Strictly forbidden!
            )
    finally:
        db.close()
