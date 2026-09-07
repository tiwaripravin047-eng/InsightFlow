"""Analysis run repository."""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.db.models.analysis_run import AnalysisRun


class AnalysisRunRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, dataset_id: uuid.UUID, rows_total: int = 0) -> AnalysisRun:
        run = AnalysisRun(
            dataset_id=dataset_id,
            status="queued",
            current_stage="validation",
            rows_processed=0,
            rows_total=rows_total,
            validation_summary={},
            started_at=datetime.utcnow(),
        )
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)
        return run

    def get_latest_by_dataset(self, dataset_id: uuid.UUID) -> Optional[AnalysisRun]:
        return (
            self.db.query(AnalysisRun)
            .filter(AnalysisRun.dataset_id == dataset_id)
            .order_by(AnalysisRun.started_at.desc())
            .first()
        )

    def get(self, run_id: uuid.UUID) -> Optional[AnalysisRun]:
        return self.db.query(AnalysisRun).filter(AnalysisRun.id == run_id).first()

    def update_stage(
        self,
        run_id: uuid.UUID,
        stage: str,
        rows_processed: int,
        status: Optional[str] = None,
        validation_summary: Optional[dict] = None,
        error_message: Optional[str] = None,
    ) -> Optional[AnalysisRun]:
        run = self.get(run_id)
        if run:
            run.current_stage = stage
            run.rows_processed = rows_processed
            if status is not None:
                run.status = status
            if validation_summary is not None:
                run.validation_summary = validation_summary
            if error_message is not None:
                run.error_message = error_message
            if status in {"complete", "failed"}:
                run.completed_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(run)
        return run
