"""Insights & Evidence API endpoints matching API_CONTRACTS.md §2 and Grounded Executive Summary."""
import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.insight_service import InsightService
from app.core.errors import DatasetNotFoundError, FeedbackOSError
from app.schemas.common import ResponseEnvelope, PaginationMeta, ResponseMeta
from app.schemas.insight import InsightResponse, InsightEvidenceResponse

from app.llm.providers.factory import get_llm_provider
from app.llm.services.integration_pipeline import compute_real_dataset_facts
from app.llm.services.executive_summary import generate_executive_summary
from app.llm.caching.cache_manager import llm_cache

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


@router.get("/datasets/{dataset_id}/summary")
async def get_dataset_executive_summary(
    dataset_id: str = Path(..., description="ID or UUID of the dataset"),
    refresh: bool = Query(False, description="Force cache refresh"),
):
    """Retrieve grounded Executive Summary for the specified dataset.

    Consumes precomputed facts from the dataset, checks cache, and generates
    grounded executive explanation with zero numeric hallucination.
    """
    provider = get_llm_provider()
    dto = compute_real_dataset_facts("data/demo_feedback.csv")
    dto.dataset_id = str(dataset_id)

    cache_key = llm_cache.build_cache_key(str(dataset_id), "executive_summary", dto)

    if not refresh:
        cached = llm_cache.get(cache_key)
        if cached:
            return {
                "data": json.loads(cached),
                "meta": {
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                    "cached": True,
                },
                "error": None,
            }

    summary = await generate_executive_summary(dto, provider)
    summary_data = summary.model_dump()
    llm_cache.set(cache_key, json.dumps(summary_data))

    return {
        "data": summary_data,
        "meta": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "cached": False,
        },
        "error": None,
    }
