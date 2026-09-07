"""AnalysisRun entity model for job execution tracking."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.session import Base


class AnalysisRun(Base):
    """Execution state and telemetry of an analysis job."""
    __tablename__ = "analysis_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="queued")  # queued, processing, complete, failed
    current_stage = Column(String(100), nullable=False, default="validation")
    rows_processed = Column(Integer, nullable=False, default=0)
    rows_total = Column(Integer, nullable=False, default=0)
    validation_summary = Column(JSONB, nullable=False, default=dict)
    
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    dataset = relationship("Dataset", back_populates="analysis_runs")
