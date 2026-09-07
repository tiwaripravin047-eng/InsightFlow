"""Executive Summary Schemas."""

from typing import List
from pydantic import BaseModel, Field


class ExecutiveSummaryResult(BaseModel):
    """Structured output for Executive Summary generation."""

    summary: str = Field(..., description="High-level narrative explaining what happened and what changed")
    key_points: List[str] = Field(default_factory=list, description="Core grounded bullet points")
    attention_items: List[str] = Field(default_factory=list, description="High-priority items deserving executive attention")
    is_grounded: bool = Field(default=True, description="Whether numeric verification passed")
    source: str = Field(default="llm", description="Origin: 'llm' or 'deterministic_fallback'")
