"""Theme hierarchy schemas matching API_CONTRACTS.md §4."""
from typing import List, Dict, Optional
from pydantic import BaseModel


class SubThemeResponse(BaseModel):
    id: str
    label: str
    volume: int
    sentiment_breakdown: Dict[str, float]


class ThemeResponse(BaseModel):
    id: str
    label: str
    volume: int
    sentiment_breakdown: Dict[str, float]
    trend: str = "stable"
    sub_themes: List[SubThemeResponse] = []
