"""Action repository."""
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.models.action import Action
from app.db.models.issue import Issue


class ActionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        title: str,
        issue_id: Optional[uuid.UUID] = None,
        insight_id: Optional[uuid.UUID] = None,
        suggested_owner: Optional[str] = None,
        priority: str = "high",
        outcome_before: Optional[float] = None,
    ) -> Action:
        action = Action(
            title=title,
            issue_id=issue_id,
            insight_id=insight_id,
            suggested_owner=suggested_owner,
            priority=priority,
            status="open",
            outcome_before=outcome_before,
            created_at=datetime.utcnow(),
        )
        self.db.add(action)
        self.db.commit()
        self.db.refresh(action)

        # Update linked_actions in Issue if issue_id is provided
        if issue_id:
            issue = self.db.query(Issue).filter(Issue.id == issue_id).first()
            if issue:
                current_links = list(issue.linked_actions or [])
                if str(action.id) not in current_links:
                    current_links.append(str(action.id))
                    issue.linked_actions = current_links
                    self.db.commit()

        return action

    def get(self, action_id: uuid.UUID) -> Optional[Action]:
        return self.db.query(Action).filter(Action.id == action_id).first()

    def list_by_issue(self, issue_id: uuid.UUID) -> List[Action]:
        return self.db.query(Action).filter(Action.issue_id == issue_id).all()

    def update_status(self, action_id: uuid.UUID, status: str) -> Optional[Action]:
        action = self.get(action_id)
        if action:
            action.status = status
            if status in ("resolved", "verified") and not action.resolved_at:
                action.resolved_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(action)
        return action

    def update_outcome(
        self,
        action_id: uuid.UUID,
        outcome_before: Optional[float] = None,
        outcome_after: Optional[float] = None,
    ) -> Optional[Action]:
        action = self.get(action_id)
        if action:
            if outcome_before is not None:
                action.outcome_before = outcome_before
            if outcome_after is not None:
                action.outcome_after = outcome_after
            self.db.commit()
            self.db.refresh(action)
        return action

