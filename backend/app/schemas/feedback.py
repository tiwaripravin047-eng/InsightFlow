"""Feedback schemas matching API_CONTRACTS.md §5."""
from typing import List, Optional
from pydantic import BaseModel


class AspectItem(BaseModel):
    aspect: str
    sentiment: str
    confidence: Optional[float] = None


class SimilarFeedbackItem(BaseModel):
    feedback_id: str
    similarity_score: float


class FeedbackResponse(BaseModel):
    id: str
    text: str
    sentiment: Optional[str] = None
    sentiment_confidence: Optional[float] = None
    topic: Optional[str] = None
    aspects: List[AspectItem] = []
    emotion: Optional[str] = None
    intent: Optional[str] = None
    urgency: Optional[str] = None
    severity: Optional[str] = None
    date: Optional[str] = None
    category: Optional[str] = None
    source: Optional[str] = None
    language: Optional[str] = "en"


class FeedbackDetailResponse(FeedbackResponse):
    similar_feedback: List[SimilarFeedbackItem] = []
    related_issue_id: Optional[str] = None
