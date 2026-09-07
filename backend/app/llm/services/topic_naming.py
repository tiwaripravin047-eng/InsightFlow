"""LLM-assisted Topic Naming Service.

Clustering stays fully deterministic (Track A).
The LLM's only job is to label an already-formed cluster.
"""

import re
from typing import Optional
from app.core.logging import logger
from app.llm.providers.base import LLMProvider
from app.llm.schemas.topic import ClusterContext, TopicLabelResult

TOPIC_SYSTEM_PROMPT = """You are a Topic Labeling Assistant for Feedback Intelligence OS.
Your task is ONLY to provide a concise, natural 2-to-4 word title for an existing feedback cluster.

RULES:
1. Base the label strictly on the provided top terms and representative feedback.
2. DO NOT invent arbitrary topics disconnected from the terms.
3. DO NOT re-cluster data, calculate sizes, or output conversational commentary.
4. Output ONLY the label text itself (e.g. "Wi-Fi Reliability" or "Cafeteria Food Quality").
"""


def generate_deterministic_label(context: ClusterContext) -> TopicLabelResult:
    """Generate a deterministic fallback label from top terms."""
    if not context.top_terms:
        label = "General Feedback"
    else:
        # Take top 1 or 2 terms and title-case them
        terms = [t.strip().title() for t in context.top_terms[:2] if t.strip()]
        label = " / ".join(terms) if terms else "General Feedback"

    return TopicLabelResult(
        cluster_id=context.cluster_id,
        label=label,
        label_source="deterministic",
        confidence=round(max(context.coherence_score, 0.5), 2),
    )


async def generate_topic_label(
    context: ClusterContext,
    provider: LLMProvider,
) -> TopicLabelResult:
    """Generate a human-readable cluster label using LLM with deterministic fallback."""
    # If insufficient terms are provided, use deterministic fallback
    if not context.top_terms and not context.representative_samples:
        return generate_deterministic_label(context)

    user_prompt = (
        f"Cluster ID: {context.cluster_id}\n"
        f"Top Terms: {', '.join(context.top_terms[:8])}\n"
        f"Representative Feedback:\n"
        + "\n".join([f"- {s}" for s in context.representative_samples[:5]])
        + "\n\nProvide a concise 2-4 word topic title for this cluster:"
    )

    llm_res = await provider.generate(
        user_prompt,
        system_prompt=TOPIC_SYSTEM_PROMPT,
        temperature=0.1,
        max_tokens=25,
    )

    if llm_res.status != "ok" or not llm_res.text:
        logger.warning(
            "LLM topic naming unavailable, falling back to deterministic",
            cluster_id=context.cluster_id,
            reason=llm_res.reason,
        )
        return generate_deterministic_label(context)

    raw_label = llm_res.text.strip().strip('"\'').strip()
    # Strip any "Title:" or "Topic:" prefixes
    cleaned_label = re.sub(r"^(?:topic|title|label):\s*", "", raw_label, flags=re.IGNORECASE).strip()

    # Validate length (should be concise, at most 6 words)
    words = cleaned_label.split()
    if len(words) > 6 or len(words) == 0:
        cleaned_label = " ".join(words[:4]) if words else "General Feedback"

    return TopicLabelResult(
        cluster_id=context.cluster_id,
        label=cleaned_label.title(),
        label_source="llm",
        confidence=round(context.coherence_score, 2),
    )
