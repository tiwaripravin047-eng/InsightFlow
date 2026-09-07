"""Insight repository enforcing the Evidence Link invariant."""
import uuid
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from app.core.errors import EvidenceRequiredError
from app.db.models.insight import Insight, insight_evidence
from app.db.models.feedback import Feedback
from app.db.models.topic import Topic


class InsightRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        dataset_id: uuid.UUID,
        title: str,
        sentiment: str,
        severity: str,
        priority_score: int,
        priority_factors: dict,
        evidence_feedback_ids: List[uuid.UUID],
        topic_id: Optional[uuid.UUID] = None,
        trend: str = "stable",
        change_percent: float = 0.0,
        volume: int = 0,
        unique_issue_count: int = 0,
        affected_categories: Optional[List[str]] = None,
        likely_drivers: Optional[List[dict]] = None,
        recommended_actions: Optional[List[str]] = None,
        confidence: float = 0.0,
        confidence_factors: Optional[dict] = None,
        model_versions: Optional[dict] = None,
    ) -> Insight:
        """Create an insight. NON-NEGOTIABLE: raises EvidenceRequiredError if evidence_feedback_ids is empty."""
        if not evidence_feedback_ids:
            raise EvidenceRequiredError("Cannot persist insight with zero evidence links.")

        insight = Insight(
            dataset_id=dataset_id,
            topic_id=topic_id,
            title=title,
            sentiment=sentiment,
            severity=severity,
            priority_score=priority_score,
            priority_factors=priority_factors or {},
            trend=trend,
            change_percent=change_percent,
            volume=volume if volume > 0 else len(evidence_feedback_ids),
            unique_issue_count=unique_issue_count if unique_issue_count > 0 else len(evidence_feedback_ids),
            affected_categories=affected_categories or [],
            likely_drivers=likely_drivers or [],
            recommended_actions=recommended_actions or [],
            confidence=confidence,
            confidence_factors=confidence_factors or {},
            model_versions=model_versions or {},
            generated_at=datetime.utcnow(),
        )
        self.db.add(insight)
        self.db.flush()  # assign insight.id

        # Insert evidence links
        links = [
            {"insight_id": insight.id, "feedback_id": fb_id}
            for fb_id in set(evidence_feedback_ids)
        ]
        self.db.execute(insight_evidence.insert(), links)
        self.db.commit()
        self.db.refresh(insight)
        return insight

    def get(self, insight_id: uuid.UUID) -> Optional[Insight]:
        return (
            self.db.query(Insight)
            .options(joinedload(Insight.topic))
            .filter(Insight.id == insight_id)
            .first()
        )

    def list_filtered(
        self,
        dataset_id: uuid.UUID,
        sentiment: Optional[str] = None,
        category: Optional[str] = None,
        severity: Optional[str] = None,
        trend: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Tuple[List[Insight], int]:
        """List insights filtered and ranked by priority_score descending."""
        query = (
            self.db.query(Insight)
            .options(joinedload(Insight.topic))
            .filter(Insight.dataset_id == dataset_id)
        )

        if sentiment:
            sentiments = [s.strip().lower() for s in sentiment.split(",")]
            query = query.filter(Insight.sentiment.in_(sentiments))

        if severity:
            severities = [s.strip().lower() for s in severity.split(",")]
            query = query.filter(Insight.severity.in_(severities))

        if trend:
            trends = [t.strip().lower() for t in trend.split(",")]
            query = query.filter(Insight.trend.in_(trends))

        if category:
            categories = [c.strip() for c in category.split(",")]
            # Filter where affected_categories JSON array contains any of the categories
            conds = [Insight.affected_categories.contains([c]) for c in categories]
            from sqlalchemy import or_
            query = query.filter(or_(*conds))

        total = query.count()
        results = query.order_by(Insight.priority_score.desc()).offset(offset).limit(limit).all()
        return results, total

    def get_evidence(self, insight_id: uuid.UUID, limit: int = 20, offset: int = 0) -> Optional[Dict[str, Any]]:
        """Retrieve structured evidence for an insight."""
        insight = self.get(insight_id)
        if not insight:
            return None

        # Fetch evidence feedback items
        feedback_query = (
            self.db.query(Feedback)
            .join(insight_evidence, Feedback.id == insight_evidence.c.feedback_id)
            .filter(insight_evidence.c.insight_id == insight_id)
        )
        total_evidence = feedback_query.count()
        samples = feedback_query.order_by(Feedback.feedback_ts.desc()).offset(offset).limit(limit).all()

        # Compute sentiment distribution
        sentiment_counts = (
            self.db.query(Feedback.sentiment, func.count(Feedback.id))
            .join(insight_evidence, Feedback.id == insight_evidence.c.feedback_id)
            .filter(insight_evidence.c.insight_id == insight_id)
            .group_by(Feedback.sentiment)
            .all()
        )
        dist_dict = {s: c for s, c in sentiment_counts if s}
        total_dist = sum(dist_dict.values())
        sentiment_dist = {
            "negative": round(dist_dict.get("negative", 0) / total_dist, 2) if total_dist > 0 else 0.0,
            "neutral": round(dist_dict.get("neutral", 0) / total_dist, 2) if total_dist > 0 else 0.0,
            "positive": round(dist_dict.get("positive", 0) / total_dist, 2) if total_dist > 0 else 0.0,
        }

        # Date range
        date_min_max = (
            self.db.query(func.min(Feedback.feedback_ts), func.max(Feedback.feedback_ts))
            .join(insight_evidence, Feedback.id == insight_evidence.c.feedback_id)
            .filter(insight_evidence.c.insight_id == insight_id)
            .first()
        )
        date_from = str(date_min_max[0].date()) if date_min_max and date_min_max[0] else None
        date_to = str(date_min_max[1].date()) if date_min_max and date_min_max[1] else None

        rep_samples = [
            {
                "feedback_id": str(fb.id),
                "text": fb.raw_text,
                "sentiment": fb.sentiment or "neutral",
                "date": str(fb.feedback_ts.date()) if fb.feedback_ts else None,
            }
            for fb in samples
        ]

        return {
            "insight_id": str(insight.id),
            "evidence_count": total_evidence,
            "representative_samples": rep_samples,
            "sentiment_distribution": sentiment_dist,
            "date_range": {
                "from": date_from,
                "to": date_to,
            },
            "filters_used": {
                "topic_id": str(insight.topic_id) if insight.topic_id else None,
                "dataset_id": str(insight.dataset_id),
            }
        }
