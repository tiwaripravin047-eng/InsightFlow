"""Ask Feedback NL query schemas matching API_CONTRACTS.md §8."""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class AskFeedbackRequest(BaseModel):
    question: str = Field(..., example="What got worse this week?")


class AskFeedbackResponse(BaseModel):
    answer: str
    computed_data: Dict[str, Any] = Field(default_factory=dict)
    evidence_insight_ids: List[str] = Field(default_factory=list)
    evidence_feedback_ids: List[str] = Field(default_factory=list)
    filters_applied: Dict[str, Any] = Field(default_factory=dict)
    answerable: bool = True
