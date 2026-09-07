"""Health check endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.cache import get_cache
from app.schemas.common import ResponseEnvelope

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=ResponseEnvelope[dict])
def health_check(db: Session = Depends(get_db)):
    """System health check verifying Database and Redis availability."""
    db_ok = False
    pgvector_ok = False
    try:
        res = db.execute(text("SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';")).first()
        db_ok = True
        pgvector_ok = res is not None
    except Exception:
        db_ok = False

    cache = get_cache()
    redis_ok = cache.available

    health_status = {
        "status": "healthy" if (db_ok and redis_ok) else "degraded",
        "database": "connected" if db_ok else "unavailable",
        "pgvector": "active" if pgvector_ok else "missing",
        "redis": "connected" if redis_ok else "unavailable",
    }
    return ResponseEnvelope.success(health_status)
