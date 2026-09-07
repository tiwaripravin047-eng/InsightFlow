"""Query Translation Service: Natural Language -> Structured QueryIntent.

Translates freeform user questions into validated, versioned operational intents.
Never queries the DB directly.
"""

import json
import re
from typing import Optional
from app.core.logging import logger
from app.llm.providers.base import LLMProvider
from app.llm.schemas.query import QueryIntent, QueryFilters

TRANSLATOR_SYSTEM_PROMPT = """You are the NL Query Translation Engine for Feedback Intelligence OS.
Your task is to convert a user question into a structured JSON QueryIntent conforming to a fixed operation enum.

SUPPORTED OPERATIONS:
- "compare_periods": comparing metrics between time periods (e.g. "what got worse this week?", "what changed this month?")
- "top_issues": finding primary complaints or highest priority issues (e.g. "top issues", "why are users unhappy?")
- "topic_search": querying feedback around a specific topic or issue (e.g. "show negative feedback about Wi-Fi")
- "category_breakdown": queries about departments, facilities, or categories (e.g. "which category is most affected?")
- "emerging_issues": detecting new rapidly growing problems (e.g. "show emerging issues", "what new issues came up?")
- "sentiment_trend": queries about trend over time (e.g. "how did sentiment change over time?")
- "unsupported": questions that cannot be answered from customer feedback (e.g. weather, general trivia, writing code, etc.)

SUPPORTED METRICS: "negative_feedback", "positive_feedback", "overall_sentiment", "volume"
SUPPORTED PERIODS: "week_over_week", "month_over_month", "custom"

OUTPUT FORMAT:
Return ONLY valid JSON matching this schema:
{
  "operation": "<one of supported operations>",
  "metric": "<one of supported metrics>",
  "period": "<one of supported periods>",
  "filters": {
    "category": "<optional category string or null>",
    "topic": "<optional topic string or null>",
    "date_from": null,
    "date_to": null
  }
}
If the question is unmappable, set operation to "unsupported".
"""


def match_deterministic_intent(question: str) -> Optional[QueryIntent]:
    """Fast, reliable deterministic intent matcher for canonical query patterns."""
    q = question.lower().strip()

    # What got worse this week / compare periods
    if any(p in q for p in ["what got worse", "what worsened", "what degraded", "getting worse"]):
        return QueryIntent(
            operation="compare_periods",
            metric="negative_feedback",
            period="week_over_week",
            filters=QueryFilters(),
        )

    # What improved / positive shifts
    if any(p in q for p in ["what improved", "what got better", "what are users happy about"]):
        return QueryIntent(
            operation="compare_periods",
            metric="positive_feedback",
            period="week_over_week",
            filters=QueryFilters(),
        )

    # Emerging issues
    if any(p in q for p in ["emerging issue", "emerging problems", "new issues", "what is emerging"]):
        return QueryIntent(
            operation="emerging_issues",
            metric="negative_feedback",
            period="week_over_week",
            filters=QueryFilters(),
        )

    # Top issues / why unhappy
    if any(p in q for p in ["top issue", "top problem", "why are users unhappy", "why are students unhappy", "biggest issue"]):
        return QueryIntent(
            operation="top_issues",
            metric="negative_feedback",
            period="month_over_month",
            filters=QueryFilters(),
        )

    # Category breakdown
    if any(p in q for p in ["which category", "category breakdown", "most affected category", "which department"]):
        return QueryIntent(
            operation="category_breakdown",
            metric="negative_feedback",
            period="week_over_week",
            filters=QueryFilters(),
        )

    # Topic search e.g. "show negative feedback about wifi" or "feedback about hostel"
    topic_match = re.search(r"(?:about|on|regarding|for)\s+([a-zA-Z0-9_\-\s/]+)", q)
    if topic_match and any(w in q for w in ["feedback", "complaints", "reviews", "show", "search"]):
        raw_topic = topic_match.group(1).strip().title()
        # Clean extra punctuation
        raw_topic = re.sub(r"[?!.,]", "", raw_topic)
        metric = "positive_feedback" if "positive" in q else "negative_feedback"
        return QueryIntent(
            operation="topic_search",
            metric=metric,
            period="month_over_month",
            filters=QueryFilters(topic=raw_topic),
        )

    # Explicit general knowledge / out of scope checks
    trivia_keywords = ["weather", "president", "capital of", "who wrote", "poem", "recipe", "python code", "solve"]
    if any(k in q for k in trivia_keywords):
        return QueryIntent(operation="unsupported")

    return None


async def translate_query_to_intent(
    question: str,
    provider: Optional[LLMProvider] = None,
) -> QueryIntent:
    """Translate natural language user question to structured QueryIntent."""
    # 1. Check deterministic rule matcher first (zero latency, rock solid)
    fast_match = match_deterministic_intent(question)
    if fast_match:
        return fast_match

    # 2. If no direct match and no LLM provider, fallback to unsupported
    if not provider:
        return QueryIntent(operation="unsupported")

    # 3. Call LLM for translation
    llm_res = await provider.generate(
        question,
        system_prompt=TRANSLATOR_SYSTEM_PROMPT,
        temperature=0.0,
        max_tokens=200,
    )

    if llm_res.status != "ok" or not llm_res.text:
        logger.warning("LLM query translation failed, marking unsupported", reason=llm_res.reason)
        return QueryIntent(operation="unsupported")

    # Parse JSON
    text = llm_res.text.strip()
    if "```" in text:
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            text = match.group(1).strip()

    try:
        data = json.loads(text)
        return QueryIntent.model_validate(data)
    except Exception as exc:
        logger.warning("Failed to validate LLM query intent JSON", error=str(exc))
        return QueryIntent(operation="unsupported")
