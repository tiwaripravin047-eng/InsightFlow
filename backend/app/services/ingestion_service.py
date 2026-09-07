"""Dataset ingestion service."""
import csv
import io
import uuid
from datetime import datetime
from typing import Dict, Any, Tuple
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.core.errors import ValidationError
from app.core.logging import logger
from app.db.models.feedback import Feedback
from app.db.repositories.dataset_repo import DatasetRepository
from app.db.repositories.analysis_run_repo import AnalysisRunRepository


class IngestionService:
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()
        self.dataset_repo = DatasetRepository(db)
        self.run_repo = AnalysisRunRepository(db)

    async def ingest_csv(
        self,
        file: UploadFile,
        name: str,
        domain: str,
        column_mapping: Dict[str, str],
        run_in_background: bool = True,
    ) -> Tuple[str, str]:
        """Validate, parse, and persist raw feedback dataset."""
        # Validate file type
        filename = file.filename or ""
        if not (filename.endswith(".csv") or filename.endswith(".txt")):
            raise ValidationError("Unsupported file format. Please upload a CSV file.")

        content = await file.read()
        max_bytes = self.settings.UPLOAD_MAX_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise ValidationError(f"File size exceeds maximum allowed size of {self.settings.UPLOAD_MAX_MB}MB.")

        # Parse CSV
        try:
            text_stream = io.StringIO(content.decode("utf-8-sig"))
            reader = csv.DictReader(text_stream)
        except Exception as exc:
            raise ValidationError(f"Malformed CSV content: {str(exc)}")

        text_col = column_mapping.get("text")
        if not text_col:
            raise ValidationError("Column mapping must specify a 'text' field.")

        rows = list(reader)
        if not rows:
            raise ValidationError("Uploaded CSV file is empty.")

        if len(rows) > self.settings.UPLOAD_MAX_ROWS:
            raise ValidationError(f"Row count exceeds maximum limit of {self.settings.UPLOAD_MAX_ROWS} rows.")

        fieldnames = reader.fieldnames or []
        if text_col not in fieldnames:
            raise ValidationError(f"Mapped text column '{text_col}' not found in CSV headers: {fieldnames}")

        # Validate summary
        empty_text = 0
        duplicate_text = 0
        invalid_dates = 0
        seen_texts = set()

        ts_col = column_mapping.get("timestamp")
        cat_col = column_mapping.get("category")
        src_col = column_mapping.get("source")

        feedback_entries = []
        for r in rows:
            raw_text = (r.get(text_col) or "").strip()
            if not raw_text:
                empty_text += 1
                continue

            if raw_text in seen_texts:
                duplicate_text += 1
            seen_texts.add(raw_text)

            # Date parsing
            fb_date = datetime.utcnow()
            if ts_col and r.get(ts_col):
                raw_date = r.get(ts_col).strip()
                try:
                    fb_date = datetime.fromisoformat(raw_date)
                except Exception:
                    try:
                        fb_date = datetime.strptime(raw_date, "%Y-%m-%d")
                    except Exception:
                        invalid_dates += 1

            cat_val = r.get(cat_col).strip() if (cat_col and r.get(cat_col)) else "General"
            src_val = r.get(src_col).strip() if (src_col and r.get(src_col)) else "survey"

            feedback_entries.append({
                "raw_text": raw_text,
                "category": cat_val,
                "source": src_val,
                "feedback_ts": fb_date,
            })

        if not feedback_entries:
            raise ValidationError("No valid feedback rows found after validation.")

        # Create Dataset
        dataset = self.dataset_repo.create(
            name=name,
            domain=domain,
            column_mapping=column_mapping,
            total_rows=len(feedback_entries),
        )

        # Bulk insert raw feedback rows
        feedback_models = [
            Feedback(
                dataset_id=dataset.id,
                raw_text=item["raw_text"],
                category=item["category"],
                source=item["source"],
                feedback_ts=item["feedback_ts"],
            )
            for item in feedback_entries
        ]
        self.db.add_all(feedback_models)
        self.db.commit()

        # Create AnalysisRun
        val_summary = {
            "empty_text_rows": empty_text,
            "duplicate_rows": duplicate_text,
            "invalid_dates": invalid_dates,
        }
        run = self.run_repo.create(dataset_id=dataset.id, rows_total=len(feedback_entries))
        self.run_repo.update_stage(
            run_id=run.id,
            stage="queued",
            rows_processed=0,
            status="queued",
            validation_summary=val_summary,
        )

        # Trigger processing job
        from app.jobs.pipeline import process_dataset_task, run_pipeline
        if run_in_background:
            try:
                process_dataset_task.delay(str(dataset.id), str(run.id))
            except Exception as exc:
                logger.warning("celery_delay_failed_falling_back_to_in_process", error=str(exc))
                # Fallback to direct synchronous execution if Celery worker is unreachable
                run_pipeline(dataset.id, run.id, self.db)
        else:
            run_pipeline(dataset.id, run.id, self.db)

        return str(dataset.id), str(run.id)
