"""Integration test for database models and end-to-end batch pipeline."""
import io
import uuid
import pytest
from fastapi import UploadFile
from app.db.session import SessionLocal
from app.db.models.dataset import Dataset
from app.db.models.feedback import Feedback
from app.db.models.insight import Insight
from app.db.models.issue import Issue
from app.services.ingestion_service import IngestionService
from app.jobs.pipeline import run_pipeline


@pytest.mark.asyncio
async def test_end_to_end_pipeline_integration():
    db = SessionLocal()
    try:
        csv_data = (
            "feedback_text,department,channel,created_at\n"
            "The cafeteria food was cold and stale,Hostel,survey,2026-09-01\n"
            "Food quality in hostel mess is terrible every day,Hostel,survey,2026-09-02\n"
            "Wifi disconnects repeatedly in library,Library,support,2026-09-03\n"
            "Campus library staff is helpful and polite,Library,survey,2026-09-04\n"
            "Internet speed in computer lab is fast,IT,survey,2026-09-05\n"
        )
        file = UploadFile(
            filename="test_feedback.csv",
            file=io.BytesIO(csv_data.encode("utf-8")),
        )

        service = IngestionService(db)
        dataset_id_str, run_id_str = await service.ingest_csv(
            file=file,
            name="Test Integration Dataset",
            domain="college",
            column_mapping={"text": "feedback_text", "category": "department", "source": "channel", "timestamp": "created_at"},
            run_in_background=False,  # Run synchronously to verify pipeline output
        )

        dataset_id = uuid.UUID(dataset_id_str)
        run_id = uuid.UUID(run_id_str)

        # Verify dataset exists
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        assert dataset is not None
        assert dataset.total_rows == 5

        # Verify feedback records created with sentiment and embeddings
        fbs = db.query(Feedback).filter(Feedback.dataset_id == dataset_id).all()
        assert len(fbs) == 5
        for fb in fbs:
            assert fb.sentiment in {"positive", "negative", "neutral"}
            assert fb.embedding is not None

        # Verify insights created and linked to evidence
        insights = db.query(Insight).filter(Insight.dataset_id == dataset_id).all()
        assert len(insights) > 0

        for ins in insights:
            assert ins.priority_score >= 0
            assert ins.severity in {"low", "medium", "high", "critical"}
            # NON-NEGOTIABLE EVIDENCE RULE: At least one feedback record cited
            assert len(ins.evidence_feedback) > 0

        # Verify operational issues created
        issues = db.query(Issue).filter(Issue.dataset_id == dataset_id).all()
        assert len(issues) > 0
    finally:
        db.close()
