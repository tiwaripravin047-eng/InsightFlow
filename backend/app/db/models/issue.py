"""Issue management view model extending Insight."""
import uuid
from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.session import Base


class Issue(Base):
    """Operational management view over an Insight."""
    __tablename__ = "issues"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    insight_id = Column(UUID(as_uuid=True), ForeignKey("insights.id", ondelete="CASCADE"), nullable=True, index=True)
    
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    affected_segments = Column(JSONB, nullable=False, default=list)
    owner = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, default="open")  # open, in_progress, resolved, verified
    linked_actions = Column(JSONB, nullable=False, default=list)

    # Relationships
    dataset = relationship("Dataset", back_populates="issues")
    insight = relationship("Insight", back_populates="issues")
    actions = relationship("Action", back_populates="issue")
