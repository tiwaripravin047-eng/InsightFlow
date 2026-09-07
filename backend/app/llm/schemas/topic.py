"""Topic Naming Assist Schemas."""

from typing import List, Literal
from pydantic import BaseModel, Field


class ClusterContext(BaseModel):
    """Context of an already-computed cluster provided by Track A."""

    cluster_id: str = Field(..., description="UUID or identifier of the cluster")
    top_terms: List[str] = Field(..., description="Top TF-IDF or c-TF-IDF terms from cluster")
    representative_samples: List[str] = Field(default_factory=list, description="Sample feedback strings")
    cluster_size: int = Field(..., ge=0, description="Precomputed number of items in cluster")
    coherence_score: float = Field(..., ge=0.0, le=1.0, description="Precomputed cluster coherence score")


class TopicLabelResult(BaseModel):
    """Output label for the cluster."""

    cluster_id: str
    label: str = Field(..., description="Human-readable 2-4 word label")
    label_source: Literal["llm", "deterministic"] = Field(
        ...,
        description="Source of the label. Must be explicitly 'llm' or 'deterministic'",
    )
    confidence: float = Field(..., ge=0.0, le=1.0)
