"""Action Center service."""
import uuid
from typing import Optional
from sqlalchemy.orm import Session
from app.db.repositories.action_repo import ActionRepository
from app.schemas.action import ActionCreate, ActionUpdate, ActionResponse


class ActionService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ActionRepository(db)

    def create_action(self, issue_id: uuid.UUID, data: ActionCreate) -> ActionResponse:
        action = self.repo.create(
            title=data.title,
            issue_id=issue_id,
            suggested_owner=data.suggested_owner,
            priority=data.priority or "high",
        )
        return ActionResponse(
            id=str(action.id),
            issue_id=str(action.issue_id) if action.issue_id else None,
            status=action.status,
            created_at=action.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            resolved_at=action.resolved_at.strftime("%Y-%m-%dT%H:%M:%SZ") if action.resolved_at else None,
            outcome_before=action.outcome_before,
            outcome_after=action.outcome_after,
        )

    def update_action(self, action_id: uuid.UUID, data: ActionUpdate) -> Optional[ActionResponse]:
        action = self.repo.update_status(action_id, data.status)
        if not action:
            return None

        return ActionResponse(
            id=str(action.id),
            issue_id=str(action.issue_id) if action.issue_id else None,
            status=action.status,
            created_at=action.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            resolved_at=action.resolved_at.strftime("%Y-%m-%dT%H:%M:%SZ") if action.resolved_at else None,
            outcome_before=action.outcome_before,
            outcome_after=action.outcome_after,
        )
