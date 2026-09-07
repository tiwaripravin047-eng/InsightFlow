"""Local / Ollama LLM Provider implementation."""

import asyncio
from typing import Optional
import httpx
from app.core.logging import logger
from app.llm.providers.base import LLMProvider, LLMResult


class LocalProvider(LLMProvider):
    """Local OpenAI-compatible or Ollama provider."""

    def __init__(
        self,
        endpoint: str = "http://localhost:11434/v1",
        model: str = "llama3:latest",
        timeout: float = 30.0,
        max_retries: int = 2,
    ):
        self.endpoint = endpoint.rstrip("/")
        self.model = model
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

        # Check if endpoint already includes v1
        if self.endpoint.endswith("/v1"):
            url = f"{self.endpoint}/chat/completions"
        else:
            url = f"{self.endpoint}/v1/chat/completions"

        last_error = ""

        for attempt in range(1, self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(url, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                        return LLMResult(
                            status="ok",
                            text=content,
                            provider="local",
                            model=self.model,
                        )
                    else:
                        last_error = f"HTTP {response.status_code}: {response.text[:150]}"
            except httpx.ConnectError:
                last_error = f"Cannot connect to local endpoint at {self.endpoint}"
                logger.warning("Local LLM connection refused", endpoint=self.endpoint, attempt=attempt)
            except httpx.TimeoutException:
                last_error = f"Local LLM timed out after {self.timeout}s"
                logger.warning("Local LLM timeout", endpoint=self.endpoint, attempt=attempt)
            except Exception as exc:
                last_error = str(exc)
                logger.warning("Local LLM error", error=str(exc), attempt=attempt)

            if attempt < self.max_retries:
                await asyncio.sleep(0.3)

        return LLMResult(
            status="unavailable",
            reason=f"Local LLM service unavailable: {last_error}",
            provider="local",
            model=self.model,
        )
