"""Action Center entity model."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base


class Action(Base):
    """Action item created to resolve an issue, with outcome tracking."""
    __tablename__ = "actions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    issue_id = Column(UUID(as_uuid=True), ForeignKey("issues.id", ondelete="SET NULL"), nullable=True, index=True)
    insight_id = Column(UUID(as_uuid=True), ForeignKey("insights.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title = Column(String(500), nullable=False)
    status = Column(String(50), nullable=False, default="open")  # open, in_progress, resolved, verified
    suggested_owner = Column(String(255), nullable=True)
    priority = Column(String(50), nullable=True, default="high")  # low, medium, high
    
    outcome_before = Column(Float, nullable=True)
    outcome_after = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    issue = relationship("Issue", back_populates="actions")
    insight = relationship("Insight", back_populates="actions")
