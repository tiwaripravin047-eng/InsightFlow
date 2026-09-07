"""Insight entity and evidence join table."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.session import Base

# Non-negotiable Evidence Join Table linking every Insight to Feedback rows
insight_evidence = Table(
    "insight_evidence",
    Base.metadata,
    Column("insight_id", UUID(as_uuid=True), ForeignKey("insights.id", ondelete="CASCADE"), primary_key=True),
    Column("feedback_id", UUID(as_uuid=True), ForeignKey("feedback.id", ondelete="CASCADE"), primary_key=True),
)


class Insight(Base):
    """Core evidence-grounded insight entity for Issue Radar."""
    __tablename__ = "insights"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title = Column(String(500), nullable=False)
    sentiment = Column(String(50), nullable=False)        # negative, positive, neutral, mixed
    severity = Column(String(50), nullable=False)         # low, medium, high, critical
    priority_score = Column(Integer, nullable=False, index=True)  # 0 to 100
    priority_factors = Column(JSONB, nullable=False, default=dict)
    
    trend = Column(String(50), nullable=False, default="stable")  # rising, declining, stable, emerging, resolved
    change_percent = Column(Float, nullable=False, default=0.0)
    volume = Column(Integer, nullable=False, default=0)
    unique_issue_count = Column(Integer, nullable=False, default=0)
    
    affected_categories = Column(JSONB, nullable=False, default=list)
    likely_drivers = Column(JSONB, nullable=False, default=list)
    recommended_actions = Column(JSONB, nullable=False, default=list)
    
    confidence = Column(Float, nullable=False, default=0.0)
    confidence_factors = Column(JSONB, nullable=False, default=dict)
    model_versions = Column(JSONB, nullable=False, default=dict)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    dataset = relationship("Dataset", back_populates="insights")
    topic = relationship("Topic", back_populates="insights")
    evidence_feedback = relationship("Feedback", secondary=insight_evidence, back_populates="evidence_insights")
    evidence_items = relationship("Feedback", secondary=insight_evidence, overlaps="evidence_feedback,evidence_insights")
    issues = relationship("Issue", back_populates="insight", cascade="all, delete-orphan")
    actions = relationship("Action", back_populates="insight")
