"""Ask Feedback Natural Language Query API endpoint matching API_CONTRACTS.md §8."""
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.query_service import QueryService
from app.schemas.common import ResponseEnvelope
from app.schemas.query import AskFeedbackRequest, AskFeedbackResponse

router = APIRouter(prefix="/datasets/{dataset_id}/query", tags=["Ask Feedback"])


@router.post("", response_model=ResponseEnvelope[AskFeedbackResponse])
def query_dataset(
    dataset_id: uuid.UUID,
    data: AskFeedbackRequest,
    db: Session = Depends(get_db),
):
    """Execute natural language query against dataset analytics and evidence."""
    service = QueryService(db)
    response = service.answer_query(dataset_id=dataset_id, question=data.question)
    return ResponseEnvelope.success(response)
