"""Base LLM Provider Protocol, Result Types, and Utilities."""

from typing import Literal, Optional, Protocol, runtime_checkable
from pydantic import BaseModel, Field


class LLMResult(BaseModel):
    """Result object returned by all LLM providers."""

    status: Literal["ok", "unavailable"] = Field(
        ...,
        description="Outcome of the LLM call: 'ok' on success, 'unavailable' on error/timeout/exhaustion",
    )
    text: Optional[str] = Field(
        default=None,
        description="Generated completion text if status == 'ok'",
    )
    reason: Optional[str] = Field(
        default=None,
        description="Explanation of failure when status == 'unavailable'",
    )
    provider: str = Field(
        default="",
        description="Name of the provider that handled the request",
    )
    model: str = Field(
        default="",
        description="Model identifier queried",
    )
    prompt_tokens: Optional[int] = Field(
        default=None,
        description="Prompt token usage if reported",
    )
    completion_tokens: Optional[int] = Field(
        default=None,
        description="Completion token usage if reported",
    )


@runtime_checkable
class LLMProvider(Protocol):
    """Protocol implemented by all FIOS LLM providers."""

    async def generate(
        self,
        prompt: str,
        *,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> LLMResult:
        """Generate a response for the given prompt."""
        ...
