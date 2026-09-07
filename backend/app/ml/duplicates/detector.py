"""Duplicate and near-duplicate clustering detector."""
import uuid
from typing import List, Dict, Tuple, Optional
import numpy as np

from app.core.config import get_settings


class DuplicateDetector:
    """Groups near-identical feedback into duplicate clusters based on embedding cosine similarity."""

    def __init__(self, similarity_threshold: float = None):
        if similarity_threshold is None:
            settings = get_settings()
            similarity_threshold = float(settings.analytics.get("duplicate_detection", {}).get("similarity_threshold", 0.88))
        self.threshold = similarity_threshold

    def find_duplicate_clusters(self, embeddings: List[List[float]]) -> Tuple[List[Optional[uuid.UUID]], float, int]:
        """Compute cosine similarity and group duplicates.
        Returns:
            - cluster_ids: List of UUIDs (one per feedback item)
            - duplicate_ratio: float (duplicates / total)
            - unique_issue_count: int
        """
        if not embeddings:
            return [], 0.0, 0

        n = len(embeddings)
        if n == 1:
            return [uuid.uuid4()], 0.0, 1

        emb_matrix = np.array(embeddings, dtype=np.float32)
        # Normalize vectors for dot-product cosine similarity
        norms = np.linalg.norm(emb_matrix, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        normalized = emb_matrix / norms

        sim_matrix = np.dot(normalized, normalized.T)

        cluster_ids: List[Optional[uuid.UUID]] = [None] * n
        unique_count = 0

        for i in range(n):
            if cluster_ids[i] is not None:
                continue

            # Create new cluster
            c_id = uuid.uuid4()
            cluster_ids[i] = c_id
            unique_count += 1

            # Assign all unassigned items with similarity >= threshold to this cluster
            for j in range(i + 1, n):
                if cluster_ids[j] is None and sim_matrix[i, j] >= self.threshold:
                    cluster_ids[j] = c_id

        duplicate_items_count = n - unique_count
        duplicate_ratio = round(duplicate_items_count / n, 4) if n > 0 else 0.0

        return cluster_ids, duplicate_ratio, unique_count
