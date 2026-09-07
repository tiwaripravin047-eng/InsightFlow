"""Dataset schemas matching API_CONTRACTS.md §1."""
from typing import Dict, Optional
from pydantic import BaseModel, Field


class ColumnMapping(BaseModel):
    text: str = "feedback_text"
    timestamp: Optional[str] = "created_at"
    category: Optional[str] = "department"
    source: Optional[str] = "channel"
    rating: Optional[str] = "score"


class DatasetCreate(BaseModel):
    name: str = Field(..., example="College Feedback Q3 2026")
    domain: Optional[str] = Field(default="college", example="college")
    column_mapping: ColumnMapping


class DatasetUploadResponse(BaseModel):
    dataset_id: str
    job_id: str
    status: str = "queued"


class ValidationSummary(BaseModel):
    empty_text_rows: int = 0
    duplicate_rows: int = 0
    invalid_dates: int = 0


class DatasetStatusResponse(BaseModel):
    status: str  # queued | processing | complete | failed
    progress_percent: int
    current_stage: str
    rows_processed: int
    rows_total: int
    validation_summary: ValidationSummary
    error: Optional[str] = None
