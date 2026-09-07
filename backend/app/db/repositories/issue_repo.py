"""Issue repository."""
import uuid
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from app.db.models.issue import Issue
from app.db.models.insight import Insight


class IssueRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_from_insight(
        self,
        insight: Insight,
        description: Optional[str] = None,
        affected_segments: Optional[List[str]] = None,
        owner: Optional[str] = None,
        status: str = "open",
    ) -> Issue:
        issue = Issue(
            dataset_id=insight.dataset_id,
            insight_id=insight.id,
            title=insight.title,
            description=description or f"Operational issue identified from {insight.title}",
            affected_segments=affected_segments or ["All Segments"],
            owner=owner,
            status=status,
            linked_actions=[],
        )
        self.db.add(issue)
        self.db.commit()
        self.db.refresh(issue)
        return issue

    def get(self, issue_id: uuid.UUID) -> Optional[Issue]:
        return (
            self.db.query(Issue)
            .options(joinedload(Issue.insight))
            .filter(Issue.id == issue_id)
            .first()
        )

    def get_by_insight(self, insight_id: uuid.UUID) -> Optional[Issue]:
        return (
            self.db.query(Issue)
            .options(joinedload(Issue.insight))
            .filter(Issue.insight_id == insight_id)
            .first()
        )

    def list_by_dataset(self, dataset_id: uuid.UUID, limit: int = 50, offset: int = 0) -> Tuple[List[Issue], int]:
        query = (
            self.db.query(Issue)
            .options(joinedload(Issue.insight))
            .filter(Issue.dataset_id == dataset_id)
        )
        total = query.count()
        results = query.offset(offset).limit(limit).all()
        return results, total

    def update_status(self, issue_id: uuid.UUID, status: str, owner: Optional[str] = None) -> Optional[Issue]:
        issue = self.get(issue_id)
        if issue:
            issue.status = status
            if owner is not None:
                issue.owner = owner
            self.db.commit()
            self.db.refresh(issue)
        return issue
