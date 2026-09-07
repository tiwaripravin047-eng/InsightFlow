"""Trends and Compare API endpoints matching API_CONTRACTS.md §6."""
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.trend_service import TrendService
from app.schemas.common import ResponseEnvelope
from app.schemas.trends import TrendSeriesResponse, CompareResponse

router = APIRouter(prefix="/datasets/{dataset_id}", tags=["Trends"])


@router.get("/trend", response_model=ResponseEnvelope[TrendSeriesResponse])
def get_dataset_trend(
    dataset_id: uuid.UUID,
    topic_id: Optional[uuid.UUID] = Query(None),
    window_days: int = Query(30, ge=7, le=90),
    db: Session = Depends(get_db),
):
    """Retrieve server-side daily volume and negative_ratio time series."""
    service = TrendService(db)
    trend_series = service.get_trend(dataset_id=dataset_id, topic_id=topic_id, window_days=window_days)
    return ResponseEnvelope.success(trend_series)


@router.get("/compare", response_model=ResponseEnvelope[CompareResponse])
def compare_dataset_periods(
    dataset_id: uuid.UUID,
    period_a_start: str = Query(..., example="2026-08-01"),
    period_a_end: str = Query(..., example="2026-08-31"),
    period_b_start: str = Query(..., example="2026-09-01"),
    period_b_end: str = Query(..., example="2026-09-06"),
    db: Session = Depends(get_db),
):
    """Compare two time periods for 'What Changed?' findings."""
    pa_start = datetime.fromisoformat(period_a_start)
    pa_end = datetime.fromisoformat(period_a_end)
    pb_start = datetime.fromisoformat(period_b_start)
    pb_end = datetime.fromisoformat(period_b_end)

    service = TrendService(db)
    compare_result = service.compare(
        dataset_id=dataset_id,
        period_a_start=pa_start,
        period_a_end=pa_end,
        period_b_start=pb_start,
        period_b_end=pb_end,
    )
    return ResponseEnvelope.success(compare_result)
