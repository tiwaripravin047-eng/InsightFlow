"""Ask Feedback Orchestrator Service.

Implements the end-to-end flow per Phase 8 and Phase 9:
User question
  → LLM query translator
  → Structured query intent
  → Application / Execution service
  → Real aggregation
  → LLM answer composer
  → Answer + citations + filters
"""

from typing import Optional
from app.llm.providers.base import LLMProvider
from app.llm.schemas.query import (
    AskFeedbackResponseData,
    QueryIntent,
)
from app.llm.services.query_translator import translate_query_to_intent
from app.llm.services.query_executor import execute_query_intent
from app.llm.services.query_composer import compose_grounded_answer


async def ask_feedback_query(
    dataset_id: str,
    question: str,
    provider: Optional[LLMProvider] = None,
) -> AskFeedbackResponseData:
    """Execute Ask Feedback end-to-end."""
    # 1. Translate question to structured intent
    intent = await translate_query_to_intent(question, provider)

    # 2. Execute query against dataset / database
    exec_result = await execute_query_intent(intent, dataset_id)

    # 3. If unanswerable, return honest response
    if not exec_result.answerable:
        return AskFeedbackResponseData(
            answer=exec_result.unanswerable_reason or "I can't answer that from the available feedback data.",
            computed_data={},
            evidence_insight_ids=[],
            evidence_feedback_ids=[],
            filters_applied={},
            answerable=False,
        )

    # 4. Compose grounded answer
    composed_answer = await compose_grounded_answer(question, exec_result, provider)

    return AskFeedbackResponseData(
        answer=composed_answer,
        computed_data=exec_result.computed_data,
        evidence_insight_ids=exec_result.evidence_insight_ids,
        evidence_feedback_ids=exec_result.evidence_feedback_ids,
        filters_applied=exec_result.filters_applied,
        answerable=True,
    )
