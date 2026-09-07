"""Trend and comparison schemas matching API_CONTRACTS.md §6."""
from typing import List, Optional
from pydantic import BaseModel


class TrendPoint(BaseModel):
    date: str
    volume: int
    negative_ratio: float


class TrendSeriesResponse(BaseModel):
    series: List[TrendPoint]


class CompareItem(BaseModel):
    topic: str
    change_percent: float
    evidence_insight_id: Optional[str] = None


class EmergingCompareItem(BaseModel):
    topic: str
    first_seen: str
    volume: int


class CompareResponse(BaseModel):
    improved: List[CompareItem] = []
    worsened: List[CompareItem] = []
    emerging: List[EmergingCompareItem] = []
    stable: List[CompareItem] = []
