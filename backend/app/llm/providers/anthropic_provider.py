"""Anthropic Claude LLM Provider implementation."""

import asyncio
from typing import Optional
import httpx
from app.core.logging import logger
from app.llm.providers.base import LLMProvider, LLMResult


class AnthropicProvider(LLMProvider):
    """Anthropic Messages API provider with retry, timeout, and degradation."""

    def __init__(
        self,
        api_key: Optional[str],
        model: str = "claude-3-5-sonnet-20241022",
        base_url: str = "https://api.anthropic.com/v1",
        timeout: float = 30.0,
        max_retries: int = 3,
    ):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries

    async def generate(
        self,
        prompt: str,
        *,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = 0.2,
        max_tokens: Optional[int] = 1000,
    ) -> LLMResult:
        if not self.api_key:
            logger.warning("Anthropic API key missing in environment")
            return LLMResult(
                status="unavailable",
                reason="Anthropic API key is missing. Set LLM_API_KEY.",
                provider="anthropic",
                model=self.model,
            )

        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens if max_tokens is not None else 1000,
            "temperature": temperature if temperature is not None else 0.2,
        }
        if system_prompt:
            payload["system"] = system_prompt

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }

        url = f"{self.base_url}/messages"
        last_error = ""

        for attempt in range(1, self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(url, json=payload, headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        content_blocks = data.get("content", [])
                        text = "".join([c.get("text", "") for c in content_blocks if c.get("type") == "text"])
                        usage = data.get("usage", {})
                        return LLMResult(
                            status="ok",
                            text=text,
                            provider="anthropic",
                            model=self.model,
                            prompt_tokens=usage.get("input_tokens"),
                            completion_tokens=usage.get("output_tokens"),
                        )
                    else:
                        last_error = f"HTTP {response.status_code}: {response.text[:200]}"
                        logger.warning("Anthropic API returned non-200", attempt=attempt, status_code=response.status_code)
            except httpx.TimeoutException:
                last_error = f"Request timed out after {self.timeout}s"
                logger.warning("Anthropic request timed out", attempt=attempt)
            except Exception as exc:
                last_error = str(exc)
                logger.warning("Anthropic request exception", attempt=attempt, error=str(exc))

            if attempt < self.max_retries:
                await asyncio.sleep(0.5 * (2 ** (attempt - 1)))

        return LLMResult(
            status="unavailable",
            reason=f"Anthropic service unavailable after {self.max_retries} attempts: {last_error}",
            provider="anthropic",
            model=self.model,
        )
