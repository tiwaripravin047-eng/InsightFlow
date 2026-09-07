"""Action Center schemas matching API_CONTRACTS.md §7."""
from typing import Optional
from pydantic import BaseModel, Field


class ActionCreate(BaseModel):
    title: str = Field(..., example="Inspect access-point coverage")
    suggested_owner: Optional[str] = Field(None, example="IT / Infrastructure")
    priority: Optional[str] = Field("high", example="high")


class ActionUpdate(BaseModel):
    status: str = Field(..., example="resolved")  # open, in_progress, resolved, verified


class ActionResponse(BaseModel):
    id: str
    issue_id: Optional[str] = None
    status: str
    created_at: str
    resolved_at: Optional[str] = None
    outcome_before: Optional[float] = None
    outcome_after: Optional[float] = None
