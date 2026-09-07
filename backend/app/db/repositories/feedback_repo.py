"""Feedback repository."""
import uuid
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy import func, or_, text, case
from sqlalchemy.orm import Session, joinedload
from app.db.models.feedback import Feedback
from app.db.models.topic import feedback_topics, Topic
from app.db.models.aspect import AspectSentiment


class FeedbackRepository:
    def __init__(self, db: Session):
        self.db = db

    def bulk_create(self, feedback_items: List[Feedback]) -> List[Feedback]:
        self.db.add_all(feedback_items)
        self.db.commit()
        return feedback_items

    def get(self, feedback_id: uuid.UUID) -> Optional[Feedback]:
        return (
            self.db.query(Feedback)
            .options(joinedload(Feedback.aspect_sentiments), joinedload(Feedback.topics))
            .filter(Feedback.id == feedback_id)
            .first()
        )

    def list_filtered(
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
    ) -> Tuple[List[Feedback], int]:
        """Query feedback with filtering, search, and pagination. Avoids N+1 using joinedload."""
        query = (
            self.db.query(Feedback)
            .options(joinedload(Feedback.aspect_sentiments), joinedload(Feedback.topics))
            .filter(Feedback.dataset_id == dataset_id)
        )

        if sentiment:
            sentiments = [s.strip().lower() for s in sentiment.split(",")]
            query = query.filter(Feedback.sentiment.in_(sentiments))

        if topic_id:
            query = query.join(feedback_topics, Feedback.id == feedback_topics.c.feedback_id).filter(
                feedback_topics.c.topic_id == topic_id
            )

        if date_from:
            query = query.filter(Feedback.feedback_ts >= date_from)
        if date_to:
            query = query.filter(Feedback.feedback_ts <= date_to)

        if category:
            categories = [c.strip() for c in category.split(",")]
            query = query.filter(Feedback.category.in_(categories))

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Feedback.raw_text.ilike(search_pattern),
                    Feedback.cleaned_text.ilike(search_pattern),
                )
            )

        total = query.count()
        results = query.order_by(Feedback.feedback_ts.desc()).offset(offset).limit(limit).all()
        return results, total

    def find_similar(self, feedback_id: uuid.UUID, top_k: int = 5) -> List[Dict[str, Any]]:
        """Find nearest-neighbor feedback using pgvector cosine distance."""
        target = self.db.query(Feedback).filter(Feedback.id == feedback_id).first()
        if not target or target.embedding is None:
            return []

        # Use pgvector cosine distance operator <=>
        results = (
            self.db.query(Feedback.id, Feedback.embedding.cosine_distance(target.embedding).label("distance"))
            .filter(Feedback.dataset_id == target.dataset_id, Feedback.id != target.id, Feedback.embedding.isnot(None))
            .order_by(text("distance ASC"))
            .limit(top_k)
            .all()
        )

        return [
            {
                "feedback_id": str(row.id),
                "similarity_score": round(max(0.0, 1.0 - float(row.distance)), 4),
            }
            for row in results
        ]

    def get_trend_series(self, dataset_id: uuid.UUID, topic_id: Optional[uuid.UUID] = None, window_days: int = 30) -> List[Dict[str, Any]]:
        """Calculate server-side daily volume and negative_ratio time series."""
        date_trunc_col = func.date(Feedback.feedback_ts).label("day")
        query = self.db.query(
            date_trunc_col,
            func.count(Feedback.id).label("volume"),
            func.sum(case((Feedback.sentiment == "negative", 1), else_=0)).label("neg_count"),
        ).filter(Feedback.dataset_id == dataset_id)


        if topic_id:
            query = query.join(feedback_topics, Feedback.id == feedback_topics.c.feedback_id).filter(
                feedback_topics.c.topic_id == topic_id
            )

        rows = (
            query.group_by(date_trunc_col)
            .order_by(date_trunc_col.asc())
            .limit(window_days)
            .all()
        )

        series = []
        for r in rows:
            vol = r.volume or 0
            neg = r.neg_count or 0
            ratio = round(neg / vol, 2) if vol > 0 else 0.0
            series.append({
                "date": str(r.day),
                "volume": vol,
                "negative_ratio": ratio,
            })
        return series
