"""OpenAI LLM Provider implementation."""

import asyncio
from typing import Optional
import httpx
from app.core.logging import logger
from app.llm.providers.base import LLMProvider, LLMResult


class OpenAIProvider(LLMProvider):
    """OpenAI API provider with timeout, exponential backoff retries, and graceful degradation."""

    def __init__(
        self,
        api_key: Optional[str],
        model: str = "gpt-4o-mini",
        base_url: str = "https://api.openai.com/v1",
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
            logger.warning("OpenAI API key missing in environment")
            return LLMResult(
                status="unavailable",
                reason="OpenAI API key is missing. Set LLM_API_KEY.",
                provider="openai",
                model=self.model,
            )

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature if temperature is not None else 0.2,
            "max_tokens": max_tokens if max_tokens is not None else 1000,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        url = f"{self.base_url}/chat/completions"
        last_error = ""

        for attempt in range(1, self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(url, json=payload, headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        choice = data.get("choices", [{}])[0]
                        content = choice.get("message", {}).get("content", "")
                        usage = data.get("usage", {})
                        return LLMResult(
                            status="ok",
                            text=content,
                            provider="openai",
                            model=self.model,
                            prompt_tokens=usage.get("prompt_tokens"),
                            completion_tokens=usage.get("completion_tokens"),
                        )
                    else:
                        last_error = f"HTTP {response.status_code}: {response.text[:200]}"
                        logger.warning(
                            "OpenAI API call returned non-200",
                            attempt=attempt,
                            status_code=response.status_code,
                        )
            except httpx.TimeoutException:
                last_error = f"Request timed out after {self.timeout}s"
                logger.warning("OpenAI request timed out", attempt=attempt)
            except Exception as exc:
                last_error = str(exc)
                logger.warning("OpenAI request exception", attempt=attempt, error=str(exc))

            if attempt < self.max_retries:
                await asyncio.sleep(0.5 * (2 ** (attempt - 1)))

        return LLMResult(
            status="unavailable",
            reason=f"OpenAI service unavailable after {self.max_retries} attempts: {last_error}",
            provider="openai",
            model=self.model,
        )
