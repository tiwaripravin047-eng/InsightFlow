"""Common envelope, pagination, and error schemas matching API_CONTRACTS.md."""
from datetime import datetime
from typing import Generic, Optional, TypeVar, Any, Dict
from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationMeta(BaseModel):
    limit: int
    offset: int
    total: int


class ResponseMeta(BaseModel):
    pagination: Optional[PaginationMeta] = None
    generated_at: str = Field(default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"))


class ErrorDetail(BaseModel):
    code: str
    message: str


class ResponseEnvelope(BaseModel, Generic[T]):
    """Standard API response envelope matching API_CONTRACTS.md and ARCHITECTURE.md §21."""
    data: Optional[T] = None
    meta: Optional[ResponseMeta] = None
    error: Optional[ErrorDetail] = None

    @classmethod
    def success(cls, data: T, pagination: Optional[PaginationMeta] = None) -> "ResponseEnvelope[T]":
        meta = ResponseMeta(pagination=pagination) if pagination else ResponseMeta()
        return cls(data=data, meta=meta, error=None)

    @classmethod
    def fail(cls, code: str, message: str) -> "ResponseEnvelope[None]":
        return cls(data=None, meta=None, error=ErrorDetail(code=code, message=message))
