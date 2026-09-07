"""Schemas for Ask Feedback (NL Query Translation, Execution, and Grounded Citations)."""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


SupportedOperation = Literal[
    "compare_periods",
    "top_issues",
    "topic_search",
    "category_breakdown",
    "emerging_issues",
    "sentiment_trend",
    "unsupported",
]

SupportedMetric = Literal[
    "negative_feedback",
    "positive_feedback",
    "overall_sentiment",
    "volume",
]

SupportedPeriod = Literal[
    "week_over_week",
    "month_over_month",
    "custom",
]


class QueryFilters(BaseModel):
    category: Optional[str] = None
    topic: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None


class QueryIntent(BaseModel):
    """Structured, versioned query intent translated from natural language."""

    operation: SupportedOperation = Field(..., description="Fixed enum of supported operations")
    metric: SupportedMetric = Field(default="negative_feedback")
    period: SupportedPeriod = Field(default="week_over_week")
    filters: QueryFilters = Field(default_factory=QueryFilters)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    explanation: Optional[str] = None


class QueryExecutionResult(BaseModel):
    """Computed facts returned by analytics/DB query execution (Track A contract)."""

    operation: str
    computed_data: Dict[str, Any] = Field(default_factory=dict)
    evidence_feedback_ids: List[str] = Field(default_factory=list)
    evidence_insight_ids: List[str] = Field(default_factory=list)
    filters_applied: Dict[str, Any] = Field(default_factory=dict)
    evidence_texts: List[str] = Field(default_factory=list)
    answerable: bool = True
    unanswerable_reason: Optional[str] = None


class AskFeedbackRequest(BaseModel):
    """POST /datasets/{id}/query request body."""

    question: str = Field(..., min_length=1, description="Natural language question from user")


class AskFeedbackResponseData(BaseModel):
    """POST /datasets/{id}/query response data field matching API_CONTRACTS.md §8."""

    answer: str
    computed_data: Dict[str, Any] = Field(default_factory=dict)
    evidence_insight_ids: List[str] = Field(default_factory=list)
    evidence_feedback_ids: List[str] = Field(default_factory=list)
    filters_applied: Dict[str, Any] = Field(default_factory=dict)
    answerable: bool = True
