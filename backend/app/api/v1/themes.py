"""Themes API endpoint matching API_CONTRACTS.md §4."""
import uuid
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.repositories.topic_repo import TopicRepository
from app.db.repositories.dataset_repo import DatasetRepository
from app.core.errors import DatasetNotFoundError
from app.schemas.common import ResponseEnvelope
from app.schemas.themes import ThemeResponse

router = APIRouter(prefix="/datasets/{dataset_id}/themes", tags=["Themes"])


@router.get("", response_model=ResponseEnvelope[List[ThemeResponse]])
def get_dataset_themes(dataset_id: uuid.UUID, db: Session = Depends(get_db)):
    """Retrieve hierarchical themes and sub-themes for a dataset."""
    dataset_repo = DatasetRepository(db)
    if not dataset_repo.get(dataset_id):
        raise DatasetNotFoundError(f"Dataset {dataset_id} not found")

    topic_repo = TopicRepository(db)
    raw_themes = topic_repo.get_hierarchical_themes(dataset_id)
    themes = [ThemeResponse(**th) for th in raw_themes]
    return ResponseEnvelope.success(themes)
