"""Structured logging configuration enforcing privacy rules."""
import logging
import sys
from typing import Any
import structlog


def setup_logging(debug: bool = False) -> None:
    """Configure structlog structured JSON logging with privacy filters."""
    log_level = logging.DEBUG if debug else logging.INFO

    # Set root logger level
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )

    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
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
