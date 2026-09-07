"""FastAPI Main Application Entrypoint."""
import uuid
from datetime import datetime, timezone
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import structlog

from app.core.config import get_settings
from app.core.logging import setup_logging, logger
from app.core.errors import FeedbackOSError
from app.api.v1 import api_router
from app.db.session import check_db_connection
from app.jobs.celery_app import check_redis_connection

settings = get_settings()
setup_logging(debug=settings.DEBUG)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Feedback Intelligence OS — AI-Powered Feedback Intelligence Backend, ML, and Analytics Engine",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Correlation ID Middleware (Track C / Observability)
@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    """Inject correlation ID (X-Request-ID) into structlog context and response headers."""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(request_id=request_id)

    response: Response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# CORS Configuration (RULES.md §9: Restricted to known origins, no wildcard in production)
origins = settings.cors_origin_list
if settings.ENVIRONMENT == "production" and "*" in origins:
    logger.warning("Wildcard CORS detected in production! Restricting to empty list.")
    origins = []

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else (["*"] if settings.DEBUG else []),
    allow_origin_regex=r"^https?://.*" if settings.DEBUG else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(FeedbackOSError)
async def feedback_os_exception_handler(request: Request, exc: FeedbackOSError):
    """Handle domain exceptions with standard API contract error envelope."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "data": None,
            "error": {
                "code": exc.code,
                "message": exc.message,
            },
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors with standard API contract error envelope."""
    msg = "; ".join([f"{err['loc'][-1]}: {err['msg']}" for err in exc.errors()])
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "data": None,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": msg,
            },
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected server errors without leaking raw tracebacks."""
    logger.error("unhandled_server_error", error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "data": None,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred during processing.",
            },
        },
    )


# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
def root_health_check():
    """Root service health check endpoint for container health probes."""
    db_ok = check_db_connection()
    redis_ok = check_redis_connection()
    is_healthy = db_ok and redis_ok

    return {
        "status": "healthy" if is_healthy else "degraded",
        "services": {
            "database": "connected" if db_ok else "unavailable",
            "redis": "connected" if redis_ok else "unavailable",
            "llm_provider": settings.LLM_PROVIDER,
        },
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/metrics", tags=["Observability"])
def metrics_endpoint():
    """Prometheus metrics exposition endpoint."""
    try:
        from app.llm.observability.metrics import llm_metrics
        return Response(
            content=llm_metrics.export_prometheus(),
            media_type="text/plain; version=0.0.4; charset=utf-8",
        )
    except Exception as exc:
        logger.error("metrics_export_failed", error=str(exc))
        return Response(content="# Error exporting metrics\n", media_type="text/plain")


@app.get("/", tags=["Root"])
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
    }
