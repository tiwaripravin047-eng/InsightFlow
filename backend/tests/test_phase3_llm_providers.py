"""Tests for Phase 3: LLM Provider Abstraction."""

import pytest
import httpx
from unittest.mock import AsyncMock, patch
from app.core.config import Settings
from app.llm.providers.base import LLMResult, LLMProvider
from app.llm.providers.factory import get_llm_provider
from app.llm.providers.openai_provider import OpenAIProvider
from app.llm.providers.anthropic_provider import AnthropicProvider
from app.llm.providers.google_provider import GoogleProvider
from app.llm.providers.local_provider import LocalProvider


def test_factory_provider_selection():
    """Verify factory returns appropriate provider instance without application code changes."""
    cfg_openai = Settings(LLM_PROVIDER="openai", LLM_API_KEY="test-key")
    p_openai = get_llm_provider(cfg_openai)
    assert isinstance(p_openai, OpenAIProvider)
    assert p_openai.model == "gpt-4o-mini"

    cfg_anthropic = Settings(LLM_PROVIDER="anthropic", LLM_API_KEY="test-key", LLM_MODEL="claude-3-5-sonnet")
    p_anthropic = get_llm_provider(cfg_anthropic)
    assert isinstance(p_anthropic, AnthropicProvider)
    assert p_anthropic.model == "claude-3-5-sonnet"

    cfg_google = Settings(LLM_PROVIDER="google", LLM_API_KEY="test-key")
    p_google = get_llm_provider(cfg_google)
    assert isinstance(p_google, GoogleProvider)

    cfg_local = Settings(LLM_PROVIDER="local", LOCAL_LLM_ENDPOINT="http://localhost:11434/v1")
    p_local = get_llm_provider(cfg_local)
    assert isinstance(p_local, LocalProvider)


@pytest.mark.anyio
async def test_missing_api_key_graceful_degradation():
    """Verify that missing API key returns typed unavailable without raising."""
    provider = OpenAIProvider(api_key=None, max_retries=1)
    result = await provider.generate("Test prompt")
    assert isinstance(result, LLMResult)
    assert result.status == "unavailable"
    assert "missing" in result.reason.lower()

    anthropic_provider = AnthropicProvider(api_key="", max_retries=1)
    result_ant = await anthropic_provider.generate("Test prompt")
    assert result_ant.status == "unavailable"

    google_provider = GoogleProvider(api_key=None, max_retries=1)
    result_goog = await google_provider.generate("Test prompt")
    assert result_goog.status == "unavailable"


@pytest.mark.anyio
async def test_local_provider_unreachable_endpoint():
    """Verify that unreachable local endpoint returns typed unavailable without crashing."""
    provider = LocalProvider(
        endpoint="http://127.0.0.1:59999/v1",  # Nothing listening
        timeout=1.0,
        max_retries=1,
    )
    result = await provider.generate("Summarize this feedback")
    assert isinstance(result, LLMResult)
    assert result.status == "unavailable"
    assert result.text is None
    assert "unavailable" in result.reason.lower() or "connect" in result.reason.lower()


@pytest.mark.anyio
async def test_mock_successful_generation():
    """Verify successful response parsing and typed LLMResult format."""
    provider = OpenAIProvider(api_key="mock-key", max_retries=1)

    mock_resp = httpx.Response(
        status_code=200,
        json={
            "choices": [{"message": {"content": "This is a grounded summary."}}],
            "usage": {"prompt_tokens": 50, "completion_tokens": 15},
        },
        request=httpx.Request("POST", "https://api.openai.com/v1/chat/completions"),
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        result = await provider.generate("Summarize facts", system_prompt="Be concise")
        assert result.status == "ok"
        assert result.text == "This is a grounded summary."
        assert result.prompt_tokens == 50
        assert result.completion_tokens == 15
        assert result.provider == "openai"
