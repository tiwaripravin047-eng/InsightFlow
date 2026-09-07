"""Dataset model."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.session import Base


class Dataset(Base):
    """Uploaded and registered feedback dataset."""
    __tablename__ = "datasets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    domain = Column(String(100), nullable=True, default="general")
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    column_mapping = Column(JSONB, nullable=False, default=dict)
    total_rows = Column(Integer, default=0, nullable=False)
    processed_rows = Column(Integer, default=0, nullable=False)
    raw_file_path = Column(String(500), nullable=True)

    # Relationships
    feedback_records = relationship("Feedback", back_populates="dataset", cascade="all, delete-orphan")
    topics = relationship("Topic", back_populates="dataset", cascade="all, delete-orphan")
    insights = relationship("Insight", back_populates="dataset", cascade="all, delete-orphan")
    issues = relationship("Issue", back_populates="dataset", cascade="all, delete-orphan")
    analysis_runs = relationship("AnalysisRun", back_populates="dataset", cascade="all, delete-orphan")
