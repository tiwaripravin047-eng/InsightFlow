"""Insight and Issue Radar service."""
import uuid
from typing import Tuple, List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.core.errors import DatasetNotFoundError
from app.db.repositories.insight_repo import InsightRepository
from app.db.repositories.dataset_repo import DatasetRepository
from app.schemas.insight import InsightResponse, InsightEvidenceResponse, PriorityFactors, LikelyDriver, ConfidenceFactors, ModelVersions


class InsightService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = InsightRepository(db)
        self.dataset_repo = DatasetRepository(db)

    def get_insights(
        self,
        dataset_id: uuid.UUID,
        sentiment: Optional[str] = None,
        category: Optional[str] = None,
        severity: Optional[str] = None,
        trend: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Tuple[List[InsightResponse], int]:
        if not self.dataset_repo.get(dataset_id):
            raise DatasetNotFoundError(f"Dataset {dataset_id} not found")

        insights, total = self.repo.list_filtered(
            dataset_id=dataset_id,
            sentiment=sentiment,
            category=category,
            severity=severity,
            trend=trend,
            limit=limit,
            offset=offset,
        )

        responses = []
        for ins in insights:
            pf = ins.priority_factors or {}
            cf = ins.confidence_factors or {}
            mv = ins.model_versions or {}

            responses.append(
                InsightResponse(
                    id=str(ins.id),
                    title=ins.title,
                    topic_id=str(ins.topic_id) if ins.topic_id else None,
                    topic_label=ins.topic.label if ins.topic else "General",
                    sentiment=ins.sentiment,
                    severity=ins.severity,
                    priority_score=ins.priority_score,
                    priority_factors=PriorityFactors(
                        sentiment_severity=pf.get("sentiment_severity", 0.0),
                        normalized_frequency=pf.get("normalized_frequency", 0.0),
                        growth_rate=pf.get("growth_rate", 0.0),
                        recurrence=pf.get("recurrence", 0.0),
                        urgency_signal=pf.get("urgency_signal", 0.0),
                    ),
                    trend=ins.trend,
                    change_percent=ins.change_percent,
                    volume=ins.volume,
                    unique_issue_count=ins.unique_issue_count,
                    affected_categories=ins.affected_categories or [],
                    likely_drivers=[
                        LikelyDriver(topic=d.get("topic", ""), correlation_strength=d.get("correlation_strength", 0.0))
                        for d in (ins.likely_drivers or [])
                    ],
                    recommended_actions=ins.recommended_actions or [],
                    confidence=ins.confidence,
                    confidence_factors=ConfidenceFactors(
                        sample_size=cf.get("sample_size", ins.volume),
                        topic_coherence=cf.get("topic_coherence", 0.70),
                        duplicate_ratio=cf.get("duplicate_ratio", 0.15),
                    ),
                    model_versions=ModelVersions(
                        sentiment=mv.get("sentiment", "roberta-sentiment-v1"),
                        embedding=mv.get("embedding", "minilm-l6-v2"),
                        pipeline=mv.get("pipeline", "v1.2"),
                    ),
                    generated_at=ins.generated_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
                )
            )

        return responses, total

    def get_evidence(self, insight_id: uuid.UUID, limit: int = 20, offset: int = 0) -> Optional[InsightEvidenceResponse]:
        raw_evidence = self.repo.get_evidence(insight_id, limit=limit, offset=offset)
        if not raw_evidence:
            return None

        return InsightEvidenceResponse(**raw_evidence)
