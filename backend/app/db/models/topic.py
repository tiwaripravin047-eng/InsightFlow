"""Topic and Theme models supporting hierarchy."""
import uuid
from sqlalchemy import Column, String, Float, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.db.session import Base

# Association table for feedback <-> topic mapping with distance
feedback_topics = Table(
    "feedback_topics",
    Base.metadata,
    Column("feedback_id", UUID(as_uuid=True), ForeignKey("feedback.id", ondelete="CASCADE"), primary_key=True),
    Column("topic_id", UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), primary_key=True),
    Column("distance_to_centroid", Float, nullable=True),
)


class Topic(Base):
    """Semantic topic or sub-theme discovered via clustering."""
    __tablename__ = "topics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_topic_id = Column(UUID(as_uuid=True), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True)
    label = Column(String(255), nullable=False)
    centroid = Column(Vector(384), nullable=True)
    coherence_score = Column(Float, nullable=True, default=0.0)

    # Relationships
    dataset = relationship("Dataset", back_populates="topics")
    parent_topic = relationship("Topic", remote_side=[id], backref="sub_topics")
    feedback_items = relationship("Feedback", secondary=feedback_topics, back_populates="topics")
    insights = relationship("Insight", back_populates="topic")
