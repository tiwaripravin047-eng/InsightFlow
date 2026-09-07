"""Ask Feedback NL query schemas matching API_CONTRACTS.md §8."""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class AskFeedbackRequest(BaseModel):
    question: str = Field(..., example="What got worse this week?")


class AskFeedbackResponse(BaseModel):
    answer: str
    computed_data: Dict[str, Any] = {}
    evidence_insight_ids: List[str] = []
    filters_applied: Dict[str, Any] = {}
    answerable: bool = True
