"""Tests for Phase 1: Local Infrastructure and Configuration."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import Settings
from app.core.logging import mask_sensitive_data


def test_settings_defaults():
    """Verify default configuration values."""
    s = Settings(
        DATABASE_URL="sqlite:///:memory:",
        REDIS_URL="redis://localhost:6379/0",
        CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000",
    )
    assert s.LLM_PROVIDER in ["openai", "anthropic", "google", "local"]
    assert s.STORAGE_BACKEND in ["local", "s3"]
    assert len(s.cors_origin_list) == 2
    assert "http://localhost:3000" in s.cors_origin_list
    assert s.USE_ANALYTICS_STUB is False


def test_logging_masks_secrets():
    """Verify sensitive keys and feedback text are masked appropriately."""
    event = {
        "event": "test_event",
        "api_key": "sk-1234567890",
        "password": "supersecretpassword",
        "jwt_secret": "myjwtsecret",
        "feedback_text": "The hostel wifi never works in room 402",
    }
    masked = mask_sensitive_data(None, None, dict(event))
    assert masked["api_key"] == "***REDACTED***"
    assert masked["password"] == "***REDACTED***"
    assert masked["jwt_secret"] == "***REDACTED***"
    assert "wifi" not in masked["feedback_text"]


def test_health_endpoints():
    """Verify health endpoints execute and return envelope."""
    client = TestClient(app)

    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "services" in data
    assert "database" in data["services"]
    assert "redis" in data["services"]

    v1_res = client.get("/api/v1/health")
    assert v1_res.status_code == 200
    v1_data = v1_res.json()
    assert "data" in v1_data
    assert "meta" in v1_data
    assert "generated_at" in v1_data["meta"]
