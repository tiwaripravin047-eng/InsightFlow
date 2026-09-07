"""Issue management service."""
import uuid
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.core.errors import DatasetNotFoundError, FeedbackOSError
from app.db.repositories.issue_repo import IssueRepository
from app.db.repositories.dataset_repo import DatasetRepository
from app.schemas.issue import IssueResponse
from app.schemas.insight import PriorityFactors, LikelyDriver, ConfidenceFactors, ModelVersions


class IssueService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = IssueRepository(db)
        self.dataset_repo = DatasetRepository(db)

    def get_issue(self, dataset_id: uuid.UUID, issue_id: uuid.UUID) -> Optional[IssueResponse]:
        if not self.dataset_repo.get(dataset_id):
            raise DatasetNotFoundError(f"Dataset {dataset_id} not found")

        issue = self.repo.get(issue_id)
        if not issue or issue.dataset_id != dataset_id:
            return None

        ins = issue.insight
        pf = ins.priority_factors if ins else {}
        cf = ins.confidence_factors if ins else {}
        mv = ins.model_versions if ins else {}

        return IssueResponse(
            id=str(ins.id) if ins else str(issue.id),
            title=issue.title,
            topic_id=str(ins.topic_id) if (ins and ins.topic_id) else None,
            topic_label=ins.topic.label if (ins and ins.topic) else "General",
            sentiment=ins.sentiment if ins else "negative",
            severity=ins.severity if ins else "medium",
            priority_score=ins.priority_score if ins else 50,
            priority_factors=PriorityFactors(
                sentiment_severity=pf.get("sentiment_severity", 0.0),
                normalized_frequency=pf.get("normalized_frequency", 0.0),
                growth_rate=pf.get("growth_rate", 0.0),
                recurrence=pf.get("recurrence", 0.0),
                urgency_signal=pf.get("urgency_signal", 0.0),
            ),
            trend=ins.trend if ins else "stable",
            change_percent=ins.change_percent if ins else 0.0,
            volume=ins.volume if ins else 0,
            unique_issue_count=ins.unique_issue_count if ins else 0,
            affected_categories=ins.affected_categories if ins else [],
            likely_drivers=[
                LikelyDriver(topic=d.get("topic", ""), correlation_strength=d.get("correlation_strength", 0.0))
                for d in (ins.likely_drivers if ins else [])
            ],
            recommended_actions=ins.recommended_actions if ins else [],
            confidence=ins.confidence if ins else 0.8,
            confidence_factors=ConfidenceFactors(
                sample_size=cf.get("sample_size", ins.volume if ins else 0),
                topic_coherence=cf.get("topic_coherence", 0.70),
                duplicate_ratio=cf.get("duplicate_ratio", 0.15),
            ),
            model_versions=ModelVersions(
                sentiment=mv.get("sentiment", "roberta-sentiment-v1"),
                embedding=mv.get("embedding", "minilm-l6-v2"),
                pipeline=mv.get("pipeline", "v1.2"),
            ),
            generated_at=ins.generated_at.strftime("%Y-%m-%dT%H:%M:%SZ") if ins else "",
            description=issue.description,
            affected_segments=issue.affected_segments or [],
            owner=issue.owner,
            status=issue.status,
            linked_actions=issue.linked_actions or [],
        )

    def list_issues(self, dataset_id: uuid.UUID, limit: int = 50, offset: int = 0) -> Tuple[List[IssueResponse], int]:
        if not self.dataset_repo.get(dataset_id):
            raise DatasetNotFoundError(f"Dataset {dataset_id} not found")

        issues, total = self.repo.list_by_dataset(dataset_id, limit=limit, offset=offset)
        responses = []
        for iss in issues:
            resp = self.get_issue(dataset_id, iss.id)
            if resp:
                responses.append(resp)
        return responses, total
