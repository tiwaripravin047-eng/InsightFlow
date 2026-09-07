"""LLM Provider Factory with lazy initialization."""

from typing import Optional
from app.core.config import Settings, settings as global_settings
from app.llm.providers.base import LLMProvider
from app.llm.providers.openai_provider import OpenAIProvider
from app.llm.providers.anthropic_provider import AnthropicProvider
from app.llm.providers.google_provider import GoogleProvider
from app.llm.providers.local_provider import LocalProvider


def get_llm_provider(custom_settings: Optional[Settings] = None) -> LLMProvider:
    """Instantiate and return the configured LLMProvider based on settings.

    Supports dynamic swapping of LLM_PROVIDER via environment configuration
    without modifying application logic.
    """
    cfg = custom_settings or global_settings
    provider_type = cfg.LLM_PROVIDER.lower()

    if provider_type == "openai":
        return OpenAIProvider(
            api_key=cfg.LLM_API_KEY,
            model=cfg.LLM_MODEL,
            timeout=cfg.LLM_TIMEOUT_SECONDS,
            max_retries=cfg.LLM_MAX_RETRIES,
        )
    elif provider_type == "anthropic":
        return AnthropicProvider(
            api_key=cfg.LLM_API_KEY,
            model=cfg.LLM_MODEL,
            timeout=cfg.LLM_TIMEOUT_SECONDS,
            max_retries=cfg.LLM_MAX_RETRIES,
        )
    elif provider_type == "google":
        return GoogleProvider(
            api_key=cfg.LLM_API_KEY,
            model=cfg.LLM_MODEL,
            timeout=cfg.LLM_TIMEOUT_SECONDS,
            max_retries=cfg.LLM_MAX_RETRIES,
        )
    elif provider_type == "local":
        return LocalProvider(
            endpoint=cfg.LOCAL_LLM_ENDPOINT,
            model=cfg.LLM_MODEL,
            timeout=cfg.LLM_TIMEOUT_SECONDS,
            max_retries=cfg.LLM_MAX_RETRIES,
        )
    else:
        # Fallback to local
        return LocalProvider(
            endpoint=cfg.LOCAL_LLM_ENDPOINT,
            model=cfg.LLM_MODEL,
            timeout=cfg.LLM_TIMEOUT_SECONDS,
            max_retries=cfg.LLM_MAX_RETRIES,
        )
