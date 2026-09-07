"""Action Center API endpoints matching API_CONTRACTS.md §7."""
from datetime import datetime, timezone
import uuid
from typing import List
from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.action_service import ActionService
from app.core.errors import FeedbackOSError
from app.schemas.common import ResponseEnvelope
from app.schemas.action import ActionCreate, ActionUpdate, ActionResponse

from app.llm.providers.factory import get_llm_provider
from app.llm.services.integration_pipeline import compute_real_dataset_facts
from app.llm.services.action_recommendation import generate_action_recommendation, ActionContext

router = APIRouter(tags=["Action Center"])


@router.get("/actions", response_model=ResponseEnvelope[List[ActionResponse]])
def list_actions(db: Session = Depends(get_db)):
    """Retrieve all action items across issues."""
    service = ActionService(db)
    actions = service.list_actions()
    return ResponseEnvelope.success(actions)


@router.post("/issues/{issue_id}/actions", response_model=ResponseEnvelope[ActionResponse], status_code=201)
def create_issue_action(
    issue_id: uuid.UUID,
    data: ActionCreate,
    db: Session = Depends(get_db),
):
    """Create an action item linked to an issue."""
    service = ActionService(db)
    action = service.create_action(issue_id=issue_id, data=data)
    return ResponseEnvelope.success(action)


@router.patch("/actions/{action_id}", response_model=ResponseEnvelope[ActionResponse])
def update_action_status(
    action_id: uuid.UUID,
    data: ActionUpdate,
    db: Session = Depends(get_db),
):
    """Update action status (open -> in_progress -> resolved -> verified)."""
    service = ActionService(db)
    action = service.update_action(action_id=action_id, data=data)
    if not action:
        raise FeedbackOSError(f"Action {action_id} not found", code="NOT_FOUND", status_code=404)

    return ResponseEnvelope.success(action)


@router.get("/issues/{issue_id}/recommend-action")
async def get_issue_action_recommendation(
    issue_id: str = Path(..., description="UUID/ID of the issue/insight"),
):
    """Generate an AI-suggested action recommendation for an issue."""
    provider = get_llm_provider()
    dto = compute_real_dataset_facts("data/demo_feedback.csv")

    top_insight = dto.insights[0]
    ctx = ActionContext(
        issue_id=str(issue_id),
        topic=top_insight.topic,
        severity=top_insight.severity,
        priority_score=top_insight.priority_score,
        affected_categories=top_insight.affected_categories,
        likely_drivers=[d.topic for d in top_insight.likely_drivers],
        evidence_samples=[e.text for e in dto.evidence[:2]],
    )
    res = await generate_action_recommendation(ctx, provider)

    return {
        "data": res.model_dump(),
        "meta": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
        },
        "error": None,
    }
