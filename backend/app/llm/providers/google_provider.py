"""Google Gemini LLM Provider implementation."""

import asyncio
from typing import Optional
import httpx
from app.core.logging import logger
from app.llm.providers.base import LLMProvider, LLMResult


class GoogleProvider(LLMProvider):
    """Google Gemini API provider with retry, timeout, and degradation."""

    def __init__(
        self,
        api_key: Optional[str],
        model: str = "gemini-1.5-flash",
        base_url: str = "https://generativelanguage.googleapis.com/v1beta",
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
            logger.warning("Google API key missing in environment")
            return LLMResult(
                status="unavailable",
                reason="Google API key is missing. Set LLM_API_KEY.",
                provider="google",
                model=self.model,
            )

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature if temperature is not None else 0.2,
                "maxOutputTokens": max_tokens if max_tokens is not None else 1000,
            },
        }
        if system_prompt:
            payload["systemInstruction"] = {"parts": [{"text": system_prompt}]}

        url = f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}"
        last_error = ""

        for attempt in range(1, self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(url, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        candidates = data.get("candidates", [])
                        text = ""
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            text = "".join([p.get("text", "") for p in parts])
                        usage = data.get("usageMetadata", {})
                        return LLMResult(
                            status="ok",
                            text=text,
                            provider="google",
                            model=self.model,
                            prompt_tokens=usage.get("promptTokenCount"),
                            completion_tokens=usage.get("candidatesTokenCount"),
                        )
                    else:
                        last_error = f"HTTP {response.status_code}: {response.text[:200]}"
                        logger.warning("Google API returned non-200", attempt=attempt, status_code=response.status_code)
            except httpx.TimeoutException:
                last_error = f"Request timed out after {self.timeout}s"
                logger.warning("Google request timed out", attempt=attempt)
            except Exception as exc:
                last_error = str(exc)
                logger.warning("Google request exception", attempt=attempt, error=str(exc))

            if attempt < self.max_retries:
                await asyncio.sleep(0.5 * (2 ** (attempt - 1)))

        return LLMResult(
            status="unavailable",
            reason=f"Google Gemini service unavailable after {self.max_retries} attempts: {last_error}",
            provider="google",
            model=self.model,
        )
