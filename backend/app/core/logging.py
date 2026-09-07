"""Structured logging configuration enforcing privacy and security rules."""
import logging
import sys
from typing import Any, Dict, Optional
import structlog
from app.core.config import settings

SENSITIVE_KEYS = {
    "api_key",
    "authorization",
    "password",
    "jwt_secret",
    "s3_secret_key",
    "token",
    "secret",
}


def mask_sensitive_data(_, __, event_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Mask any sensitive fields from log events."""
    for key in list(event_dict.keys()):
        lower_key = key.lower()
        if any(s in lower_key for s in SENSITIVE_KEYS):
            event_dict[key] = "***REDACTED***"
        elif lower_key in ("feedback_text", "raw_text") and settings.LOG_LEVEL.upper() != "DEBUG":
            # RULES.md §10: Raw feedback text excluded from application logs (DEBUG-only)
            val_len = len(str(event_dict[key]))
            event_dict[key] = f"<{val_len} chars omitted; set LOG_LEVEL=DEBUG to view>"
    return event_dict


def setup_logging(debug: Optional[bool] = None) -> None:
    """Configure structlog structured logging with privacy filters."""
    is_debug = debug if debug is not None else settings.DEBUG
    log_level = logging.DEBUG if is_debug else getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    # Set root logger level
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )

    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        mask_sensitive_data,
    ]

    if settings.ENVIRONMENT in ("development", "test") and is_debug:
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer()
        ]
    else:
        processors = shared_processors + [
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ]

    structlog.configure(
        processors=processors,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


def sanitize_log_data(data: Any, is_debug: bool = False) -> Any:
    """Ensure raw feedback text is redacted in non-DEBUG logs."""
    if is_debug:
        return data
    if isinstance(data, dict):
        sanitized = {}
        for k, v in data.items():
            if k in {"text", "raw_text", "cleaned_text", "feedback_text"}:
                sanitized[k] = "[REDACTED_PRIVACY]"
            else:
                sanitized[k] = sanitize_log_data(v, is_debug)
        return sanitized
    if isinstance(data, list):
        return [sanitize_log_data(x, is_debug) for x in data]
    return data


logger = structlog.get_logger("feedback_os")
fios_logger = logger
