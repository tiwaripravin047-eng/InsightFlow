"""Aspect-level sentiment model."""
import uuid
from sqlalchemy import Column, String, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base


class AspectSentiment(Base):
    """Aspect extraction and sentiment per feedback item."""
    __tablename__ = "aspect_sentiments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    feedback_id = Column(UUID(as_uuid=True), ForeignKey("feedback.id", ondelete="CASCADE"), nullable=False, index=True)
    aspect_text = Column(String(255), nullable=False)
    sentiment = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=True)

    feedback = relationship("Feedback", back_populates="aspect_sentiments")
