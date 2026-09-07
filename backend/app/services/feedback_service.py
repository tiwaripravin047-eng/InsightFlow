"""Feedback Explorer service."""
import uuid
from datetime import datetime
from typing import Tuple, List, Optional
from sqlalchemy.orm import Session
from app.core.errors import DatasetNotFoundError
from app.db.repositories.feedback_repo import FeedbackRepository
from app.db.repositories.dataset_repo import DatasetRepository
from app.db.repositories.issue_repo import IssueRepository
from app.schemas.feedback import FeedbackResponse, FeedbackDetailResponse, AspectItem, SimilarFeedbackItem


class FeedbackService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = FeedbackRepository(db)
        self.dataset_repo = DatasetRepository(db)
        self.issue_repo = IssueRepository(db)

    def list_feedback(
        self,
        dataset_id: uuid.UUID,
        sentiment: Optional[str] = None,
        topic_id: Optional[uuid.UUID] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        category: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[FeedbackResponse], int]:
        if not self.dataset_repo.get(dataset_id):
            raise DatasetNotFoundError(f"Dataset {dataset_id} not found")

        records, total = self.repo.list_filtered(
            dataset_id=dataset_id,
            sentiment=sentiment,
            topic_id=topic_id,
            date_from=date_from,
            date_to=date_to,
            category=category,
            search=search,
            limit=limit,
            offset=offset,
        )

        responses = []
        for fb in records:
            topic_name = fb.topics[0].label if fb.topics else None
            aspect_items = [
                AspectItem(aspect=a.aspect_text, sentiment=a.sentiment, confidence=a.confidence)
                for a in fb.aspect_sentiments
            ]
            responses.append(
                FeedbackResponse(
                    id=str(fb.id),
                    text=fb.raw_text,
                    sentiment=fb.sentiment,
                    sentiment_confidence=fb.sentiment_confidence,
                    topic=topic_name,
                    aspects=aspect_items,
                    emotion=fb.emotion,
                    intent=fb.intent,
                    urgency=fb.urgency,
                    severity=fb.severity or "medium",
                    date=str(fb.feedback_ts.date()) if fb.feedback_ts else None,
                    category=fb.category,
                    source=fb.source,
                    language=fb.language,
                )
            )

        return responses, total

    def get_feedback_detail(self, feedback_id: uuid.UUID) -> Optional[FeedbackDetailResponse]:
        fb = self.repo.get(feedback_id)
        if not fb:
            return None

        # Nearest neighbor embeddings
        similar_items = self.repo.find_similar(feedback_id, top_k=5)
        sim_models = [SimilarFeedbackItem(**item) for item in similar_items]

        # Related issue if mapped to a topic with an insight
        related_issue_id = None
        if fb.topics:
            t_id = fb.topics[0].id
            from app.db.models.insight import Insight
            insight = self.db.query(Insight).filter(Insight.topic_id == t_id).first()
            if insight:
                issue = self.issue_repo.get_by_insight(insight.id)
                if issue:
                    related_issue_id = str(issue.id)

        aspect_items = [
            AspectItem(aspect=a.aspect_text, sentiment=a.sentiment, confidence=a.confidence)
            for a in fb.aspect_sentiments
        ]

        return FeedbackDetailResponse(
            id=str(fb.id),
            text=fb.raw_text,
            sentiment=fb.sentiment,
            sentiment_confidence=fb.sentiment_confidence,
            topic=fb.topics[0].label if fb.topics else None,
            aspects=aspect_items,
            emotion=fb.emotion,
            intent=fb.intent,
            urgency=fb.urgency,
            severity=fb.severity or "medium",
            date=str(fb.feedback_ts.date()) if fb.feedback_ts else None,
            category=fb.category,
            source=fb.source,
            language=fb.language,
            similar_feedback=sim_models,
            related_issue_id=related_issue_id,
        )
