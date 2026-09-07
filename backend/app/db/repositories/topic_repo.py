"""Topic repository."""
import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from app.db.models.topic import Topic, feedback_topics
from app.db.models.feedback import Feedback


class TopicRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, dataset_id: uuid.UUID, label: str, parent_topic_id: Optional[uuid.UUID] = None, centroid: Optional[list] = None, coherence_score: float = 0.0) -> Topic:
        topic = Topic(
            dataset_id=dataset_id,
            label=label,
            parent_topic_id=parent_topic_id,
            centroid=centroid,
            coherence_score=coherence_score,
        )
        self.db.add(topic)
        self.db.commit()
        self.db.refresh(topic)
        return topic

    def get(self, topic_id: uuid.UUID) -> Optional[Topic]:
        return self.db.query(Topic).filter(Topic.id == topic_id).first()

    def get_by_dataset(self, dataset_id: uuid.UUID) -> List[Topic]:
        return self.db.query(Topic).filter(Topic.id != None, Topic.dataset_id == dataset_id).all()

    def link_feedback(self, feedback_id: uuid.UUID, topic_id: uuid.UUID, distance: Optional[float] = None) -> None:
        stmt = feedback_topics.insert().values(
            feedback_id=feedback_id,
            topic_id=topic_id,
            distance_to_centroid=distance,
        )
        self.db.execute(stmt)

    def bulk_link_feedback(self, links: List[Dict[str, Any]]) -> None:
        if links:
            self.db.execute(feedback_topics.insert(), links)
            self.db.commit()

    def get_hierarchical_themes(self, dataset_id: uuid.UUID) -> List[Dict[str, Any]]:
        """Return theme -> sub-theme hierarchy with volume and sentiment breakdowns."""
        # Query root topics (parent_topic_id is None)
        root_topics = (
            self.db.query(Topic)
            .filter(Topic.dataset_id == dataset_id, Topic.parent_topic_id.is_(None))
            .all()
        )

        result = []
        for root in root_topics:
            # Aggregate feedback assigned to root or its sub-topics
            sub_topics = self.db.query(Topic).filter(Topic.parent_topic_id == root.id).all()
            all_topic_ids = [root.id] + [st.id for st in sub_topics]

            # Calculate metrics for root theme
            sentiment_counts = (
                self.db.query(Feedback.sentiment, func.count(Feedback.id))
                .join(feedback_topics, Feedback.id == feedback_topics.c.feedback_id)
                .filter(feedback_topics.c.topic_id.in_(all_topic_ids))
                .group_by(Feedback.sentiment)
                .all()
            )
            counts_dict = {s: c for s, c in sentiment_counts if s}
            total_vol = sum(counts_dict.values())
            
            neg_ratio = round(counts_dict.get("negative", 0) / total_vol, 2) if total_vol > 0 else 0.0
            neu_ratio = round(counts_dict.get("neutral", 0) / total_vol, 2) if total_vol > 0 else 0.0
            pos_ratio = round(counts_dict.get("positive", 0) / total_vol, 2) if total_vol > 0 else 0.0

            sub_theme_list = []
            for sub in sub_topics:
                sub_counts = (
                    self.db.query(Feedback.sentiment, func.count(Feedback.id))
                    .join(feedback_topics, Feedback.id == feedback_topics.c.feedback_id)
                    .filter(feedback_topics.c.topic_id == sub.id)
                    .group_by(Feedback.sentiment)
                    .all()
                )
                sub_dict = {s: c for s, c in sub_counts if s}
                sub_vol = sum(sub_dict.values())
                sub_neg_ratio = round(sub_dict.get("negative", 0) / sub_vol, 2) if sub_vol > 0 else 0.0

                sub_theme_list.append({
                    "id": str(sub.id),
                    "label": sub.label,
                    "volume": sub_vol,
                    "sentiment_breakdown": {
                        "negative": sub_neg_ratio,
                    }
                })

            result.append({
                "id": str(root.id),
                "label": root.label,
                "volume": total_vol,
                "sentiment_breakdown": {
                    "negative": neg_ratio,
                    "neutral": neu_ratio,
                    "positive": pos_ratio,
                },
                "trend": "rising" if neg_ratio > 0.5 else ("declining" if pos_ratio > 0.5 else "stable"),
                "sub_themes": sub_theme_list,
            })

        return result
