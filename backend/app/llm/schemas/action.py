"""Action Recommendation Schemas."""

from typing import List, Optional
from pydantic import BaseModel, Field


class ActionContext(BaseModel):
    """Grounding context for an issue requiring action recommendation."""

    issue_id: str = Field(..., description="UUID of the issue/insight")
    topic: str = Field(..., description="Topic label")
    severity: str = Field(..., description="Severity level: low, medium, high, critical")
    priority_score: int = Field(..., ge=0, le=100)
    affected_categories: List[str] = Field(default_factory=list)
    likely_drivers: List[str] = Field(default_factory=list)
    evidence_samples: List[str] = Field(default_factory=list)


class ActionRecommendationResult(BaseModel):
    """Structured action recommendation output."""

    issue_id: str
    recommendation: str = Field(..., description="Actionable recommendation sentence")
    label: str = Field(
        default="AI-suggested",
        description="Mandatory disclaimer label: 'AI-suggested'",
    )
    suggested_focus: str = Field(..., description="Category or operational area of focus")
    is_causal_free: bool = Field(default=True, description="Verification that no causal claims were made")
    source: str = Field(default="llm", description="'llm' or 'deterministic_fallback'")
