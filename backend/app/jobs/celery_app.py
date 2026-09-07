"""Celery application configuration."""
from celery import Celery
import redis
from app.core.config import get_settings
from app.core.logging import logger

settings = get_settings()

celery_app = Celery(
    "feedback_os_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)


def check_redis_connection() -> bool:
    """Check Redis health status."""
    try:
        r = redis.from_url(settings.REDIS_URL, socket_timeout=2)
        return bool(r.ping())
    except Exception as exc:
        logger.error("redis_connection_check_failed", error=str(exc))
        return False


@celery_app.task(name="ping_task")
def ping_task() -> str:
    """Simple health task for worker verification."""
    return "pong"
