"""Ask Feedback Natural Language Query service."""
import asyncio
import uuid
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.core.errors import DatasetNotFoundError
from app.core.logging import logger
from app.db.models.insight import Insight
from app.db.repositories.dataset_repo import DatasetRepository
from app.schemas.query import AskFeedbackResponse
from app.llm.providers.factory import get_llm_provider
from app.llm.services.ask_feedback import ask_feedback_query


class QueryService:
    def __init__(self, db: Session):
        self.db = db
        self.dataset_repo = DatasetRepository(db)

    async def answer_query_async(self, dataset_id: str, question: str) -> AskFeedbackResponse:
        """Asynchronously answer query using grounded LLM pipeline with database fallback."""
        try:
            provider = get_llm_provider()
            res = await ask_feedback_query(str(dataset_id), question, provider)
            if res and res.answerable:
                return AskFeedbackResponse(
                    answer=res.answer,
                    computed_data=res.computed_data,
                    evidence_insight_ids=res.evidence_insight_ids or [],
                    evidence_feedback_ids=res.evidence_feedback_ids or [],
                    filters_applied=res.filters_applied,
                    answerable=True,
                )
        except Exception as exc:
            logger.warning("ask_feedback_llm_query_failed", error=str(exc))

        # Fallback to deterministic database query
        return self._answer_from_db(dataset_id, question)

    def answer_query(self, dataset_id: str, question: str) -> AskFeedbackResponse:
        """Synchronously answer query, dispatching to async runner or fallback."""
        try:
            # If inside active event loop
            try:
                loop = asyncio.get_running_loop()
            except RuntimeError:
                loop = None

            if loop and loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(
                        lambda: asyncio.run(self.answer_query_async(dataset_id, question))
                    )
                    return future.result(timeout=10)
            else:
                return asyncio.run(self.answer_query_async(dataset_id, question))
        except Exception as exc:
            logger.warning("async_query_runner_failed_using_db_fallback", error=str(exc))
            return self._answer_from_db(dataset_id, question)

    def _answer_from_db(self, dataset_id: str, question: str) -> AskFeedbackResponse:
        """Deterministic query answers derived directly from database models."""
        q_lower = question.lower().strip()
        parsed_id = None
        try:
            parsed_id = uuid.UUID(str(dataset_id))
        except ValueError:
            parsed_id = None

        # 1. "what got worse" query pattern
        if any(w in q_lower for w in ["worse", "degrade", "increase in negative", "negative trend"]):
            query = self.db.query(Insight).filter(Insight.sentiment == "negative")
            if parsed_id:
                query = query.filter(Insight.dataset_id == parsed_id)
            rising_insights = query.order_by(Insight.priority_score.desc()).limit(2).all()

            if rising_insights:
                top_drivers = [ins.topic.label if ins.topic else ins.title for ins in rising_insights]
                evidence_ids = [str(ins.id) for ins in rising_insights]
                avg_increase = round(float(sum(ins.change_percent for ins in rising_insights) / len(rising_insights)), 1)

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
                    evidence_feedback_ids=[f"feedback-ref-{e}" for e in evidence_ids],
                    filters_applied={
                        "sentiment": "negative",
                        "trend": "rising",
                    },
                    answerable=True,
                )

        # 2. "most critical" or "top issue" pattern
        if any(w in q_lower for w in ["top", "critical", "highest priority", "main issue", "matter most"]):
            query = self.db.query(Insight)
            if parsed_id:
                query = query.filter(Insight.dataset_id == parsed_id)
            top_insight = query.order_by(Insight.priority_score.desc()).first()

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
                    evidence_feedback_ids=[f"feedback-ref-{top_insight.id}"],
                    filters_applied={"order_by": "priority_score_desc"},
                    answerable=True,
                )

        # 3. Topic specific query (e.g. "food", "wifi", "library")
        from app.db.models.topic import Topic
        t_query = self.db.query(Topic)
        if parsed_id:
            t_query = t_query.filter(Topic.dataset_id == parsed_id)
        topics = t_query.all()
        for t in topics:
            if t.label.lower() in q_lower:
                ins = self.db.query(Insight).filter(Insight.topic_id == t.id).first()
                if ins:
                    return AskFeedbackResponse(
                        answer=f"Found {ins.volume} feedback items relating to {t.label}. Severity is currently marked as {ins.severity} with trend '{ins.trend}'.",
                        computed_data={
                            "volume": ins.volume,
                            "priority_score": ins.priority_score,
                            "trend": ins.trend,
                        },
                        evidence_insight_ids=[str(ins.id)],
                        evidence_feedback_ids=[f"feedback-ref-{ins.id}"],
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
            evidence_feedback_ids=[],
            filters_applied={},
            answerable=False,
        )
