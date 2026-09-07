"""Issues API endpoints matching API_CONTRACTS.md §3."""
import uuid
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.issue_service import IssueService
from app.core.errors import FeedbackOSError
from app.schemas.common import ResponseEnvelope, PaginationMeta
from app.schemas.issue import IssueResponse

router = APIRouter(prefix="/datasets/{dataset_id}/issues", tags=["Issues"])


@router.get("", response_model=ResponseEnvelope[List[IssueResponse]])
def list_issues(
    dataset_id: uuid.UUID,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Retrieve operational issues list for a dataset."""
    service = IssueService(db)
    issues, total = service.list_issues(dataset_id=dataset_id, limit=limit, offset=offset)
    pagination = PaginationMeta(limit=limit, offset=offset, total=total)
    return ResponseEnvelope.success(issues, pagination=pagination)


@router.get("/{issue_id}", response_model=ResponseEnvelope[IssueResponse])
def get_issue_detail(
    dataset_id: uuid.UUID,
    issue_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Retrieve management detail view for a specific issue."""
    service = IssueService(db)
    issue = service.get_issue(dataset_id=dataset_id, issue_id=issue_id)
    if not issue:
        raise FeedbackOSError(f"Issue {issue_id} not found in dataset {dataset_id}", code="NOT_FOUND", status_code=404)

    return ResponseEnvelope.success(issue)
