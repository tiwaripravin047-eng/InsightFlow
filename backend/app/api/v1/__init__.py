"""API v1 Router aggregation."""
from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.datasets import router as datasets_router
from app.api.v1.insights import router as insights_router
from app.api.v1.issues import router as issues_router
from app.api.v1.themes import router as themes_router
from app.api.v1.feedback import router as feedback_router
from app.api.v1.trends import router as trends_router
from app.api.v1.actions import router as actions_router
from app.api.v1.query import router as query_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(datasets_router)
api_router.include_router(insights_router)
api_router.include_router(issues_router)
api_router.include_router(themes_router)
api_router.include_router(feedback_router)
api_router.include_router(trends_router)
api_router.include_router(actions_router)
api_router.include_router(query_router)

__all__ = ["api_router"]
