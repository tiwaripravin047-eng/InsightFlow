"""Datasets API endpoints matching API_CONTRACTS.md §1 & §9."""
import json
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, Response
from fastapi.responses import StreamingResponse
import io
import csv
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.ingestion_service import IngestionService
from app.db.repositories.analysis_run_repo import AnalysisRunRepository
from app.db.repositories.dataset_repo import DatasetRepository
from app.db.repositories.feedback_repo import FeedbackRepository
from app.core.errors import DatasetNotFoundError, ValidationError
from app.schemas.common import ResponseEnvelope
from app.schemas.dataset import DatasetUploadResponse, DatasetStatusResponse, ValidationSummary

router = APIRouter(prefix="/datasets", tags=["Datasets"])


@router.post("", response_model=ResponseEnvelope[DatasetUploadResponse], status_code=202)
async def upload_dataset(
    file: UploadFile = File(...),
    column_mapping: str = Form(
        ...,
        description="JSON string of column mapping, e.g. {'text': 'feedback_text', 'timestamp': 'created_at'}",
    ),
    name: str = Form(..., example="College Feedback Q3 2026"),
    domain: Optional[str] = Form("college", example="college"),
    db: Session = Depends(get_db),
):
    """Upload and register a dataset for processing."""
    try:
        mapping_dict = json.loads(column_mapping)
    except Exception as exc:
        raise ValidationError(f"Invalid column_mapping JSON: {str(exc)}")

    service = IngestionService(db)
    dataset_id, job_id = await service.ingest_csv(
        file=file,
        name=name,
        domain=domain or "college",
        column_mapping=mapping_dict,
        run_in_background=True,
    )

    return ResponseEnvelope.success(
        DatasetUploadResponse(
            dataset_id=dataset_id,
            job_id=job_id,
            status="queued",
        )
    )


@router.get("/{dataset_id}/status", response_model=ResponseEnvelope[DatasetStatusResponse])
def get_dataset_status(dataset_id: uuid.UUID, db: Session = Depends(get_db)):
    """Retrieve real-time processing and analysis status for a dataset."""
    dataset_repo = DatasetRepository(db)
    if not dataset_repo.get(dataset_id):
        raise DatasetNotFoundError(f"Dataset {dataset_id} not found")

    run_repo = AnalysisRunRepository(db)
    run = run_repo.get_latest_by_dataset(dataset_id)
    if not run:
        raise DatasetNotFoundError(f"No analysis job found for dataset {dataset_id}")

    progress_pct = int((run.rows_processed / run.rows_total * 100)) if run.rows_total > 0 else 0
    if run.status == "complete":
        progress_pct = 100

    val_dict = run.validation_summary or {}
    val_summary = ValidationSummary(
        empty_text_rows=val_dict.get("empty_text_rows", 0),
        duplicate_rows=val_dict.get("duplicate_rows", 0),
        invalid_dates=val_dict.get("invalid_dates", 0),
    )

    data = DatasetStatusResponse(
        status=run.status,
        progress_percent=progress_pct,
        current_stage=run.current_stage,
        rows_processed=run.rows_processed,
        rows_total=run.rows_total,
        validation_summary=val_summary,
        error=run.error_message,
    )
    return ResponseEnvelope.success(data)


@router.get("/{dataset_id}/export")
def export_dataset(
    dataset_id: uuid.UUID,
    format: str = "csv",
    sentiment: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Stream exported CSV matching currently applied filters."""
    dataset_repo = DatasetRepository(db)
    dataset = dataset_repo.get(dataset_id)
    if not dataset:
        raise DatasetNotFoundError(f"Dataset {dataset_id} not found")

    fb_repo = FeedbackRepository(db)
    records, _ = fb_repo.list_filtered(
        dataset_id=dataset_id,
        sentiment=sentiment,
        category=category,
        limit=100000,
        offset=0,
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "raw_text", "sentiment", "sentiment_confidence", "category", "source", "date"])

    for r in records:
        writer.writerow([
            str(r.id),
            r.raw_text,
            r.sentiment or "",
            r.sentiment_confidence or "",
            r.category or "",
            r.source or "",
            str(r.feedback_ts.date()) if r.feedback_ts else "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=export_{dataset_id}.csv"},
    )
