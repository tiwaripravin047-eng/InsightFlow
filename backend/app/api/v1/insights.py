"""Insights & Evidence API endpoints matching API_CONTRACTS.md §2."""
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.insight_service import InsightService
from app.core.errors import DatasetNotFoundError, FeedbackOSError
from app.schemas.common import ResponseEnvelope, PaginationMeta
from app.schemas.insight import InsightResponse, InsightEvidenceResponse

router = APIRouter(tags=["Insights"])


@router.get("/datasets/{dataset_id}/insights", response_model=ResponseEnvelope[List[InsightResponse]])
def get_dataset_insights(
    dataset_id: uuid.UUID,
    sentiment: Optional[str] = Query(None, example="negative"),
    category: Optional[str] = Query(None, example="Hostel"),
    severity: Optional[str] = Query(None, example="high,critical"),
    trend: Optional[str] = Query(None, example="rising"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Retrieve ranked, evidence-grounded insights for the Issue Radar."""
    service = InsightService(db)
    insights, total = service.get_insights(
        dataset_id=dataset_id,
        sentiment=sentiment,
        category=category,
        severity=severity,
        trend=trend,
        limit=limit,
        offset=offset,
    )
    pagination = PaginationMeta(limit=limit, offset=offset, total=total)
    return ResponseEnvelope.success(insights, pagination=pagination)


@router.get("/insights/{insight_id}/evidence", response_model=ResponseEnvelope[InsightEvidenceResponse])
def get_insight_evidence(
    insight_id: uuid.UUID,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Retrieve traceable evidence and representative samples for a specific insight."""
    service = InsightService(db)
    evidence = service.get_evidence(insight_id=insight_id, limit=limit, offset=offset)
    if not evidence:
        raise FeedbackOSError(f"Insight {insight_id} evidence not found", code="NOT_FOUND", status_code=404)

    return ResponseEnvelope.success(evidence)
