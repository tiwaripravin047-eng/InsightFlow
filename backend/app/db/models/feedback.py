"""Feedback entity model."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.db.session import Base
from app.db.models.topic import feedback_topics


class Feedback(Base):
    """Raw and enriched feedback entry."""
    __tablename__ = "feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    raw_text = Column(Text, nullable=False)
    cleaned_text = Column(Text, nullable=True)
    language = Column(String(10), nullable=True, default="en")
    
    # NLP Classifications
    sentiment = Column(String(50), nullable=True, index=True)  # positive, negative, neutral
    sentiment_confidence = Column(Float, nullable=True)
    emotion = Column(String(50), nullable=True)               # anger, frustration, satisfaction, etc.
    intent = Column(String(50), nullable=True)                # complaint, suggestion, praise, etc.
    urgency = Column(String(50), nullable=True)               # low, medium, high
    severity = Column(String(50), nullable=True)              # low, medium, high, critical
    
    # Embedding vector (384 dimensions for all-MiniLM-L6-v2)
    embedding = Column(Vector(384), nullable=True)
    
    # Metadata fields
    category = Column(String(255), nullable=True, index=True)
    source = Column(String(100), nullable=True)
    segment = Column(String(255), nullable=True)
    feedback_ts = Column(DateTime, nullable=True, default=datetime.utcnow, index=True)
    duplicate_cluster_id = Column(UUID(as_uuid=True), nullable=True, index=True)

    # Relationships
    dataset = relationship("Dataset", back_populates="feedback_records")
    topics = relationship("Topic", secondary=feedback_topics, back_populates="feedback_items")
    aspect_sentiments = relationship("AspectSentiment", back_populates="feedback", cascade="all, delete-orphan")
    evidence_insights = relationship("Insight", secondary="insight_evidence", back_populates="evidence_feedback")

    __table_args__ = (
        Index("ix_feedback_dataset_ts", "dataset_id", "feedback_ts"),
        Index("ix_feedback_dataset_category", "dataset_id", "category"),
        Index("ix_feedback_dataset_sentiment", "dataset_id", "sentiment"),
    )
