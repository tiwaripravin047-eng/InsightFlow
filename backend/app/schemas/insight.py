"""Insight and Evidence schemas matching API_CONTRACTS.md §2."""
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class PriorityFactors(BaseModel):
    sentiment_severity: float
    normalized_frequency: float
    growth_rate: float
    recurrence: float
    urgency_signal: float


class LikelyDriver(BaseModel):
    topic: str
    correlation_strength: float


class ConfidenceFactors(BaseModel):
    sample_size: int
    topic_coherence: float
    duplicate_ratio: float


class ModelVersions(BaseModel):
    sentiment: str = "roberta-sentiment-v1"
    embedding: str = "minilm-l6-v2"
    pipeline: str = "v1.2"


class InsightResponse(BaseModel):
    id: str
    title: str
    topic_id: Optional[str] = None
    topic_label: Optional[str] = None
    sentiment: str
    severity: str
    priority_score: int
    priority_factors: PriorityFactors
    trend: str
    change_percent: float
    volume: int
    unique_issue_count: int
    affected_categories: List[str]
    likely_drivers: List[LikelyDriver]
    recommended_actions: List[str]
    confidence: float
    confidence_factors: ConfidenceFactors
    model_versions: ModelVersions
    generated_at: str


class RepresentativeSample(BaseModel):
    feedback_id: str
    text: str
    sentiment: str
    date: Optional[str] = None


class SentimentDistribution(BaseModel):
    negative: float
    neutral: float
    positive: float


class DateRange(BaseModel):
    from_date: Optional[str] = Field(None, alias="from")
    to_date: Optional[str] = Field(None, alias="to")

    class Config:
        populate_by_name = True


class InsightEvidenceResponse(BaseModel):
    insight_id: str
    evidence_count: int
    representative_samples: List[RepresentativeSample]
    sentiment_distribution: SentimentDistribution
    date_range: DateRange
    filters_used: Dict[str, Optional[str]]
