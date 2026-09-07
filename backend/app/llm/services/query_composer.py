"""Grounded Answer Composer for Ask Feedback.

Composes natural language responses based strictly on precomputed facts.
Never calculates analytics.
"""

import json
import re
from typing import Optional
from app.core.logging import logger
from app.llm.providers.base import LLMProvider
from app.llm.schemas.query import QueryExecutionResult
from app.llm.services.executive_summary import clean_causal_language

COMPOSER_SYSTEM_PROMPT = """You are the Grounded Answer Composer for Feedback Intelligence OS.
Your role is to write a direct, concise 1-2 sentence answer to a user's question based EXCLUSIVELY on precomputed analytics facts.

MANDATORY RULES:
1. TRUTHFUL FACTS:
   - State ONLY the numbers, percentages, and topics present in the [COMPUTED DATA] section.
   - NEVER calculate, invent, round, or estimate any numbers.
2. NO CAUSAL OVERREACH:
   - Use correlational phrasing ("driven primarily by", "associated with", "appears linked to").
   - NEVER say "caused" or "proves".
3. CONCISENESS:
   - Provide a direct answer in 1-2 sentences. Do not add conversational fluff or introductory disclaimers.
"""


def compose_deterministic_answer(exec_res: QueryExecutionResult) -> str:
    """Deterministic natural language answer fallback based on computed facts."""
    if not exec_res.answerable:
        return exec_res.unanswerable_reason or "I can't answer that from the available feedback data."

    data = exec_res.computed_data
    op = exec_res.operation

    if op == "compare_periods":
        metric = data.get("metric", "negative feedback")
        change = data.get("change_percent", 0.0)
        direction = "increased" if change > 0 else "decreased"
        drivers = ", ".join(data.get("top_drivers", []))
        return (
            f"{metric.capitalize()} {direction} by {abs(change)}% this week, "
            f"primarily driven by {drivers} feedback."
        )

    if op in ("top_issues", "emerging_issues"):
        issues = ", ".join(data.get("top_issues", []))
        vol = data.get("total_negative_volume", 0)
        return (
            f"Analysis of {vol} negative feedback items indicates the leading issues are "
            f"{issues}."
        )

    if op == "topic_search":
        topic = data.get("topic", "the selected topic")
        total = data.get("total_matches", 0)
        neg = data.get("negative_count", 0)
        return (
            f"Found {total} feedback items regarding {topic}, "
            f"with {neg} expressing negative sentiment."
        )

    if op == "category_breakdown":
        top = data.get("most_affected", "General")
        return f"The category receiving the highest volume of feedback is {top}."

    return "Available feedback data does not contain sufficient details to answer this question."


async def compose_grounded_answer(
    question: str,
    exec_res: QueryExecutionResult,
    provider: Optional[LLMProvider] = None,
) -> str:
    """Compose natural language answer explaining computed facts."""
    if not exec_res.answerable:
        return exec_res.unanswerable_reason or "I can't answer that from the available feedback data."

    if not provider:
        return compose_deterministic_answer(exec_res)

    user_prompt = (
        f"User Question: {question}\n\n"
        f"[COMPUTED DATA]:\n{json.dumps(exec_res.computed_data, indent=2)}\n\n"
        f"Compose the 1-2 sentence grounded answer:"
    )

    llm_res = await provider.generate(
        user_prompt,
        system_prompt=COMPOSER_SYSTEM_PROMPT,
        temperature=0.1,
        max_tokens=150,
    )

    if llm_res.status != "ok" or not llm_res.text:
        logger.warning("LLM answer composer unavailable, using deterministic fallback", reason=llm_res.reason)
        return compose_deterministic_answer(exec_res)

    cleaned = clean_causal_language(llm_res.text.strip().strip('"\''))
    return cleaned
