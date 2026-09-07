"""Feedback Explorer API endpoints matching API_CONTRACTS.md §5."""
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.feedback_service import FeedbackService
from app.core.errors import FeedbackOSError
from app.schemas.common import ResponseEnvelope, PaginationMeta
from app.schemas.feedback import FeedbackResponse, FeedbackDetailResponse

router = APIRouter(tags=["Feedback Explorer"])


@router.get("/datasets/{dataset_id}/feedback", response_model=ResponseEnvelope[List[FeedbackResponse]])
def list_dataset_feedback(
    dataset_id: uuid.UUID,
    sentiment: Optional[str] = Query(None, example="negative"),
    topic_id: Optional[uuid.UUID] = Query(None),
    date_from: Optional[str] = Query(None, example="2026-08-01"),
    date_to: Optional[str] = Query(None, example="2026-09-06"),
    category: Optional[str] = Query(None, example="Library"),
    search: Optional[str] = Query(None, example="wifi"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Search and filter raw feedback rows for Feedback Explorer."""
    df_from = datetime.fromisoformat(date_from) if date_from else None
    df_to = datetime.fromisoformat(date_to) if date_to else None

    service = FeedbackService(db)
    items, total = service.list_feedback(
        dataset_id=dataset_id,
        sentiment=sentiment,
        topic_id=topic_id,
        date_from=df_from,
        date_to=df_to,
        category=category,
        search=search,
        limit=limit,
        offset=offset,
    )
    pagination = PaginationMeta(limit=limit, offset=offset, total=total)
    return ResponseEnvelope.success(items, pagination=pagination)


@router.get("/feedback/{feedback_id}", response_model=ResponseEnvelope[FeedbackDetailResponse])
def get_feedback_detail(feedback_id: uuid.UUID, db: Session = Depends(get_db)):
    """Retrieve full feedback detail including similar feedback embeddings and related issue."""
    service = FeedbackService(db)
    detail = service.get_feedback_detail(feedback_id)
    if not detail:
        raise FeedbackOSError(f"Feedback {feedback_id} not found", code="NOT_FOUND", status_code=404)

    return ResponseEnvelope.success(detail)
