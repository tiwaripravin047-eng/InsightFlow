"""Ask Feedback Natural Language Query API endpoint matching API_CONTRACTS.md §8."""
from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.query_service import QueryService
from app.schemas.common import ResponseEnvelope
from app.schemas.query import AskFeedbackRequest, AskFeedbackResponse

router = APIRouter(prefix="/datasets/{dataset_id}/query", tags=["Ask Feedback"])


@router.post("", response_model=ResponseEnvelope[AskFeedbackResponse])
async def query_dataset(
    data: AskFeedbackRequest,
    dataset_id: str = Path(..., description="ID or UUID of the dataset"),
    db: Session = Depends(get_db),
):
    """Execute natural language query against dataset analytics and evidence."""
    service = QueryService(db)
    response = await service.answer_query_async(dataset_id=dataset_id, question=data.question)
    return ResponseEnvelope.success(response)
