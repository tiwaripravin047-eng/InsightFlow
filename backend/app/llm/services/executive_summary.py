"""Executive Summary Generation Service."""

import json
import re
from typing import Optional
from app.core.logging import logger
from app.llm.providers.base import LLMProvider
from app.llm.schemas.grounding import GroundingDTO
from app.llm.schemas.summary import ExecutiveSummaryResult
from app.llm.prompts.executive_summary import build_executive_summary_prompt
from app.llm.grounding.verifier import verify_numeric_grounding

INSUFFICIENT_EVIDENCE_MSG = "There is not enough computed evidence to provide a reliable summary."

BANNED_CAUSAL_PHRASES = [
    r"\bconfirmed cause\b",
    r"\bdefinitely caused\b",
    r"\bproves that\b",
    r"\bcaused by\b",
    r"\bcaused\b",
]


def clean_causal_language(text: str) -> str:
    """Enforce correlation-only language by replacing banned causal phrasing."""
    cleaned = text
    for pattern in BANNED_CAUSAL_PHRASES:
        cleaned = re.sub(pattern, "is likely linked to", cleaned, flags=re.IGNORECASE)
    return cleaned


def parse_summary_json(raw_text: str) -> Optional[dict]:
    """Parse JSON safely from raw LLM output including markdown fences."""
    text = raw_text.strip()
    # Strip markdown fences ```json ... ```
    if "```" in text:
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            text = match.group(1).strip()

    try:
        data = json.loads(text)
        if isinstance(data, dict) and "summary" in data:
            return data
    except Exception as exc:
        logger.warning("Failed to parse LLM summary JSON", error=str(exc))
    return None


def generate_deterministic_summary(dto: GroundingDTO) -> ExecutiveSummaryResult:
    """Deterministic fallback summary when LLM provider is unavailable."""
    if not dto.is_sufficient_for_summary():
        return ExecutiveSummaryResult(
            summary=INSUFFICIENT_EVIDENCE_MSG,
            key_points=[],
            attention_items=[],
            is_grounded=True,
            source="deterministic_fallback",
        )

    top_insight = dto.insights[0] if dto.insights else None
    summary_text = (
        f"Across {dto.metrics.total_feedback} total feedback items, negative feedback stands at "
        f"{dto.metrics.negative_percent}%. "
    )
    if top_insight:
        summary_text += (
            f"The primary concern is {top_insight.topic} with {top_insight.volume} mentions "
            f"({top_insight.change_percent}% change)."
        )

    key_points = [
        f"{ins.topic}: {ins.volume} mentions ({ins.sentiment}, priority score: {ins.priority_score})"
        for ins in dto.insights[:3]
    ]

    attention_items = [
        f"Review conditions in affected categories: {', '.join(ins.affected_categories)}"
        for ins in dto.insights[:2] if ins.affected_categories
    ]

    return ExecutiveSummaryResult(
        summary=summary_text,
        key_points=key_points,
        attention_items=attention_items,
        is_grounded=True,
        source="deterministic_fallback",
    )


async def generate_executive_summary(
    dto: GroundingDTO,
    provider: LLMProvider,
) -> ExecutiveSummaryResult:
    """Generate a fully grounded executive summary from computed facts."""
    # 1. Check for sufficient evidence
    if not dto.is_sufficient_for_summary():
        return ExecutiveSummaryResult(
            summary=INSUFFICIENT_EVIDENCE_MSG,
            key_points=[],
            attention_items=[],
            is_grounded=True,
            source="deterministic_fallback",
        )

    # 2. Build prompts
    system_prompt, user_prompt = build_executive_summary_prompt(dto)

    # 3. Call provider
    llm_res = await provider.generate(
        user_prompt,
        system_prompt=system_prompt,
        temperature=0.2,
        max_tokens=800,
    )

    if llm_res.status != "ok" or not llm_res.text:
        logger.warning("LLM provider unavailable for summary, falling back to deterministic", reason=llm_res.reason)
        return generate_deterministic_summary(dto)

    # 4. Parse output
    parsed = parse_summary_json(llm_res.text)
    if not parsed:
        logger.warning("Invalid JSON structure from LLM, using deterministic fallback")
        return generate_deterministic_summary(dto)

    summary = clean_causal_language(parsed.get("summary", ""))
    key_points = [clean_causal_language(p) for p in parsed.get("key_points", [])]
    attention_items = [clean_causal_language(a) for a in parsed.get("attention_items", [])]

    # 5. Check numeric grounding
    full_text = f"{summary} {' '.join(key_points)} {' '.join(attention_items)}"
    is_grounded, ungrounded = verify_numeric_grounding(full_text, dto)

    if not is_grounded:
        logger.warning("Numeric hallucination detected in LLM summary! Falling back to deterministic facts", ungrounded=ungrounded)
        return generate_deterministic_summary(dto)

    return ExecutiveSummaryResult(
        summary=summary,
        key_points=key_points,
        attention_items=attention_items,
        is_grounded=True,
        source="llm",
    )
