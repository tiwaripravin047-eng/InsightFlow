"""Action Center API endpoints matching API_CONTRACTS.md §7."""
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.action_service import ActionService
from app.core.errors import FeedbackOSError
from app.schemas.common import ResponseEnvelope
from app.schemas.action import ActionCreate, ActionUpdate, ActionResponse

router = APIRouter(tags=["Action Center"])


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
