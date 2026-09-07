"""Trend and comparison service."""
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.core.errors import DatasetNotFoundError
from app.db.repositories.feedback_repo import FeedbackRepository
from app.db.repositories.dataset_repo import DatasetRepository
from app.analytics.compare import ChangeComparator
from app.schemas.trends import TrendSeriesResponse, TrendPoint, CompareResponse


class TrendService:
    def __init__(self, db: Session):
        self.db = db
        self.feedback_repo = FeedbackRepository(db)
        self.dataset_repo = DatasetRepository(db)
        self.comparator = ChangeComparator(db)

    def get_trend(self, dataset_id: uuid.UUID, topic_id: Optional[uuid.UUID] = None, window_days: int = 30) -> TrendSeriesResponse:
        if not self.dataset_repo.get(dataset_id):
            raise DatasetNotFoundError(f"Dataset {dataset_id} not found")

        raw_series = self.feedback_repo.get_trend_series(dataset_id, topic_id=topic_id, window_days=window_days)
        points = [TrendPoint(**p) for p in raw_series]
        return TrendSeriesResponse(series=points)

    def compare(
        self,
        dataset_id: uuid.UUID,
        period_a_start: datetime,
        period_a_end: datetime,
        period_b_start: datetime,
        period_b_end: datetime,
    ) -> CompareResponse:
        if not self.dataset_repo.get(dataset_id):
            raise DatasetNotFoundError(f"Dataset {dataset_id} not found")

        comp_dict = self.comparator.compare_periods(
            dataset_id=dataset_id,
            period_a_start=period_a_start,
            period_a_end=period_a_end,
            period_b_start=period_b_start,
            period_b_end=period_b_end,
        )
        return CompareResponse(**comp_dict)
