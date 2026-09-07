"""Ask Feedback Natural Language Query service."""
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.errors import DatasetNotFoundError
from app.db.models.feedback import Feedback
from app.db.models.insight import Insight
from app.db.repositories.dataset_repo import DatasetRepository
from app.schemas.query import AskFeedbackResponse


class QueryService:
    def __init__(self, db: Session):
        self.db = db
        self.dataset_repo = DatasetRepository(db)

    def answer_query(self, dataset_id: uuid.UUID, question: str) -> AskFeedbackResponse:
        dataset = self.dataset_repo.get(dataset_id)
        if not dataset:
            raise DatasetNotFoundError(f"Dataset {dataset_id} not found")

        q_lower = question.lower().strip()

        # 1. "what got worse" query pattern
        if any(w in q_lower for w in ["worse", "degrade", "increase in negative", "negative trend"]):
            # Get rising negative insights
            rising_insights = (
                self.db.query(Insight)
                .filter(Insight.dataset_id == dataset_id, Insight.sentiment == "negative")
                .order_by(Insight.priority_score.desc())
                .limit(2)
                .all()
            )

            if rising_insights:
                top_drivers = [ins.topic.label if ins.topic else ins.title for ins in rising_insights]
                evidence_ids = [str(ins.id) for ins in rising_insights]
                avg_increase = round(float(np_mean([ins.change_percent for ins in rising_insights])), 1)

                answer_text = (
                    f"Negative feedback increased approximately {avg_increase}% recently, "
                    f"primarily driven by {', '.join(top_drivers)} complaints."
                )

                return AskFeedbackResponse(
                    answer=answer_text,
                    computed_data={
                        "change_percent": avg_increase,
                        "top_drivers": top_drivers,
                    },
                    evidence_insight_ids=evidence_ids,
                    filters_applied={
                        "sentiment": "negative",
                        "trend": "rising",
                    },
                    answerable=True,
                )

        # 2. "most critical" or "top issue" pattern
        if any(w in q_lower for w in ["top", "critical", "highest priority", "main issue", "matter most"]):
            top_insight = (
                self.db.query(Insight)
                .filter(Insight.dataset_id == dataset_id)
                .order_by(Insight.priority_score.desc())
                .first()
            )

            if top_insight:
                topic_name = top_insight.topic.label if top_insight.topic else "General"
                answer_text = (
                    f"The highest priority issue is '{top_insight.title}' (Topic: {topic_name}) "
                    f"with a priority score of {top_insight.priority_score}/100 and {top_insight.volume} mentions."
                )

                return AskFeedbackResponse(
                    answer=answer_text,
                    computed_data={
                        "priority_score": top_insight.priority_score,
                        "volume": top_insight.volume,
                        "severity": top_insight.severity,
                    },
                    evidence_insight_ids=[str(top_insight.id)],
                    filters_applied={"order_by": "priority_score_desc"},
                    answerable=True,
                )

        # 3. Topic specific query (e.g. "food", "wifi", "library")
        from app.db.models.topic import Topic
        topics = self.db.query(Topic).filter(Topic.dataset_id == dataset_id).all()
        for t in topics:
            if t.label.lower() in q_lower:
                ins = self.db.query(Insight).filter(Insight.dataset_id == dataset_id, Insight.topic_id == t.id).first()
                if ins:
                    return AskFeedbackResponse(
                        answer=f"Found {ins.volume} feedback items relating to {t.label}. Severity is currently marked as {ins.severity} with trend '{ins.trend}'.",
                        computed_data={
                            "volume": ins.volume,
                            "priority_score": ins.priority_score,
                            "trend": ins.trend,
                        },
                        evidence_insight_ids=[str(ins.id)],
                        filters_applied={"topic_id": str(t.id)},
                        answerable=True,
                    )

        # Unanswerable gracefully
        return AskFeedbackResponse(
            answer=(
                "I could not map your question to available metrics or topic filters. "
                "Try asking about: 'What got worse this week?', 'What are the top issues?', or questions mentioning specific categories/topics."
            ),
            computed_data={},
            evidence_insight_ids=[],
            filters_applied={},
            answerable=False,
        )


def np_mean(lst: list) -> float:
    return sum(lst) / len(lst) if lst else 0.0
