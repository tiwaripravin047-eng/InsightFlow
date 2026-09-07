"""Action Center service with automated outcome tracking (ARCHITECTURE.md §11)."""
import uuid
from typing import Optional
from sqlalchemy.orm import Session
from app.db.models.action import Action
from app.db.models.issue import Issue
from app.db.models.feedback import Feedback
from app.db.models.topic import feedback_topics
from app.db.repositories.action_repo import ActionRepository
from app.schemas.action import ActionCreate, ActionUpdate, ActionResponse


class ActionService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ActionRepository(db)

    def create_action(self, issue_id: uuid.UUID, data: ActionCreate) -> ActionResponse:
        # Automatically snapshot outcome_before from the linked issue's insight
        outcome_before = None
        issue = self.db.query(Issue).filter(Issue.id == issue_id).first()
        if issue and issue.insight:
            factors = issue.insight.priority_factors or {}
            outcome_before = factors.get("sentiment_severity")
            if outcome_before is None and issue.insight.priority_score is not None:
                outcome_before = round(issue.insight.priority_score / 100.0, 4)

        action = self.repo.create(
            title=data.title,
            issue_id=issue_id,
            insight_id=issue.insight_id if issue else None,
            suggested_owner=data.suggested_owner,
            priority=data.priority or "high",
            outcome_before=outcome_before,
        )
        return self._to_response(action)

    def update_action(self, action_id: uuid.UUID, data: ActionUpdate) -> Optional[ActionResponse]:
        action = self.repo.update_status(action_id, data.status)
        if not action:
            return None

        # Recompute after outcome if marked resolved or verified
        if data.status in ("resolved", "verified"):
            self._compute_and_store_outcome_after(action)

        return self._to_response(action)

    def recompute_action_outcome(self, action_id: uuid.UUID) -> Optional[ActionResponse]:
        """Recompute before vs after outcome metric for a resolved action item."""
        action = self.repo.get(action_id)
        if not action:
            return None

        self._compute_and_store_outcome_after(action)
        return self._to_response(action)

    def _compute_and_store_outcome_after(self, action: Action) -> None:
        if not action.issue or not action.issue.insight:
            return
        topic_id = action.issue.insight.topic_id
        if not topic_id:
            return

        query = (
            self.db.query(Feedback)
            .join(feedback_topics, Feedback.id == feedback_topics.c.feedback_id)
            .filter(feedback_topics.c.topic_id == topic_id)
        )

        if action.resolved_at:
            post_fb = query.filter(Feedback.feedback_ts >= action.resolved_at).all()
            if post_fb:
                neg = sum(1 for f in post_fb if f.sentiment == "negative")
                action.outcome_after = round(neg / len(post_fb), 4)
                self.db.commit()
                self.db.refresh(action)
                return

        # If no post-resolution batch yet, compute against current topic feedback
        all_fb = query.all()
        if all_fb:
            neg = sum(1 for f in all_fb if f.sentiment == "negative")
            action.outcome_after = round(neg / len(all_fb), 4)
            self.db.commit()
            self.db.refresh(action)

    def _to_response(self, action: Action) -> ActionResponse:
        return ActionResponse(
            id=str(action.id),
            issue_id=str(action.issue_id) if action.issue_id else None,
            status=action.status,
            created_at=action.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            resolved_at=action.resolved_at.strftime("%Y-%m-%dT%H:%M:%SZ") if action.resolved_at else None,
            outcome_before=action.outcome_before,
            outcome_after=action.outcome_after,
        )

