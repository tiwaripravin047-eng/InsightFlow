"""Grounding Data Transfer Objects (DTO) and Schema Definitions.

Enforces the canonical grounding contract per Phase 4:
Deterministic DB/Analytics -> GroundingDTO -> LLM -> Validated Structured Response
"""

from typing import List, Literal, Optional
from pydantic import BaseModel, Field, field_validator


class TimeWindow(BaseModel):
    start: str = Field(..., description="Start date/time of analysis window (ISO format)")
    end: str = Field(..., description="End date/time of analysis window (ISO format)")


class DatasetMetrics(BaseModel):
    total_feedback: int = Field(..., ge=0, description="Total feedback rows in window")
    negative_percent: float = Field(..., ge=0.0, le=100.0, description="Percentage negative feedback")
    positive_percent: Optional[float] = Field(None, ge=0.0, le=100.0, description="Percentage positive feedback")
    neutral_percent: Optional[float] = Field(None, ge=0.0, le=100.0, description="Percentage neutral feedback")


class LikelyDriverFact(BaseModel):
    topic: str
    correlation_strength: float = Field(..., ge=0.0, le=1.0)


class GroundedInsightFact(BaseModel):
    insight_id: str = Field(..., description="UUID of insight")
    topic: str = Field(..., description="Topic label")
    volume: int = Field(..., ge=0, description="Mention volume")
    change_percent: float = Field(..., description="Period-over-period percentage change")
    sentiment: Literal["negative", "positive", "neutral", "mixed"]
    severity: Literal["low", "medium", "high", "critical"]
    priority_score: int = Field(..., ge=0, le=100, description="0-100 deterministic priority score")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score 0.0-1.0")
    affected_categories: List[str] = Field(default_factory=list)
    likely_drivers: List[LikelyDriverFact] = Field(default_factory=list)


class EvidenceSample(BaseModel):
    feedback_id: str = Field(..., description="UUID of feedback row")
    text: str = Field(..., description="Representative user feedback text")


class GroundingDTO(BaseModel):
    """Canonical Grounding DTO passed from Analytics layer to LLM layer."""

    dataset_id: str = Field(..., description="UUID of dataset")
    time_window: TimeWindow
    metrics: DatasetMetrics
    insights: List[GroundedInsightFact] = Field(default_factory=list)
    evidence: List[EvidenceSample] = Field(default_factory=list)

    @field_validator("insights")
    @classmethod
    def validate_insights_bounds(cls, v: List[GroundedInsightFact]) -> List[GroundedInsightFact]:
        # Ensure bounded context: never pass unbounded thousands of items
        if len(v) > 50:
            return v[:50]
        return v

    @field_validator("evidence")
    @classmethod
    def validate_evidence_bounds(cls, v: List[EvidenceSample]) -> List[EvidenceSample]:
        # Ensure bounded context: representative samples only (max 30)
        if len(v) > 30:
            return v[:30]
        return v

    def is_sufficient_for_summary(self) -> bool:
        """Check whether computed facts are sufficient to warrant executive summary."""
        if self.metrics.total_feedback <= 0:
            return False
        if not self.insights:
            return False
        return True
