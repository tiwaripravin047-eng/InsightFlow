"""Job progress tracker updating AnalysisRun state."""
import uuid
from typing import Optional
from sqlalchemy.orm import Session
from app.db.repositories.analysis_run_repo import AnalysisRunRepository
from app.core.logging import logger


class ProgressTracker:
    def __init__(self, db: Session, run_id: uuid.UUID):
        self.db = db
        self.run_id = run_id
        self.repo = AnalysisRunRepository(db)

    def update(
        self,
        stage: str,
        rows_processed: int,
        status: Optional[str] = None,
        validation_summary: Optional[dict] = None,
        error_message: Optional[str] = None,
    ) -> None:
        logger.info(
            "pipeline_progress",
            run_id=str(self.run_id),
            stage=stage,
            rows_processed=rows_processed,
            status=status,
        )
        self.repo.update_stage(
            run_id=self.run_id,
            stage=stage,
            rows_processed=rows_processed,
            status=status,
            validation_summary=validation_summary,
            error_message=error_message,
        )
