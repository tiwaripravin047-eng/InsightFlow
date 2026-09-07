"""Issue management schemas matching API_CONTRACTS.md §3."""
from typing import List, Optional
from app.schemas.insight import (
    PriorityFactors,
    LikelyDriver,
    ConfidenceFactors,
    ModelVersions,
    InsightResponse,
)


class IssueResponse(InsightResponse):
    """Superset of Insight with operational management fields."""
    description: Optional[str] = None
    affected_segments: List[str] = []
    owner: Optional[str] = None
    status: str = "open"
    linked_actions: List[str] = []
