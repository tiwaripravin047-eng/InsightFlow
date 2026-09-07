"""ModelVersion tracking entity."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base


class ModelVersion(Base):
    """Tracks active model and pipeline versions."""
    __tablename__ = "model_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    component = Column(String(100), nullable=False)  # sentiment, embedding, topic, pipeline
    model_name = Column(String(255), nullable=False)
    model_version = Column(String(100), nullable=False)
    activated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
