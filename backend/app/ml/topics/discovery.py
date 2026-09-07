"""Semantic Topic and Theme Discovery using BERTopic and HDBSCAN."""
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from bertopic import BERTopic
from hdbscan import HDBSCAN
from app.core.config import get_settings
from app.core.logging import logger


class TopicClusterResult:
    def __init__(
        self,
        topic_id: int,
        label: str,
        keywords: List[str],
        indices: List[int],
        centroid: List[float],
        coherence_score: float,
        parent_label: Optional[str] = None,
    ):
        self.topic_id = topic_id
        self.label = label
        self.keywords = keywords
        self.indices = indices
        self.centroid = centroid
        self.coherence_score = coherence_score
        self.parent_label = parent_label


class TopicDiscoveryEngine:
    """Discovers semantic clusters from embeddings and documents."""

    def __init__(self, min_topic_size: int = 3):
        self.min_topic_size = min_topic_size

    def discover_topics(
        self,
        documents: List[str],
        embeddings: List[List[float]],
    ) -> List[TopicClusterResult]:
        """Perform semantic clustering using HDBSCAN and c-TF-IDF keyword extraction."""
        if len(documents) < self.min_topic_size:
            # Fallback for very small datasets
            centroid = np.mean(embeddings, axis=0).tolist() if embeddings else [0.0] * 384
            return [
                TopicClusterResult(
                    topic_id=0,
                    label="General Feedback",
                    keywords=["feedback", "general"],
                    indices=list(range(len(documents))),
                    centroid=centroid,
                    coherence_score=0.75,
                )
            ]

        emb_matrix = np.array(embeddings, dtype=np.float32)

        try:
            # Configure HDBSCAN
            hdbscan_model = HDBSCAN(
                min_cluster_size=max(2, self.min_topic_size),
                metric="euclidean",
                cluster_selection_method="eom",
                prediction_data=True,
            )

            vectorizer_model = CountVectorizer(stop_words="english", min_df=1, ngram_range=(1, 2))

            topic_model = BERTopic(
                hdbscan_model=hdbscan_model,
                vectorizer_model=vectorizer_model,
                verbose=False,
            )

            topics, probs = topic_model.fit_transform(documents, emb_matrix)
        except Exception as exc:
            logger.warning("bertopic_clustering_failed", error=str(exc), msg="Using fallback k-means clustering")
            from sklearn.cluster import KMeans
            n_clusters = min(4, len(documents))
            kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=5)
            topics = kmeans.fit_predict(emb_matrix)
            topic_model = None

        # Group indices by topic
        topic_groups: Dict[int, List[int]] = {}
        for idx, t_id in enumerate(topics):
            # BERTopic assigns -1 to outliers; group them into an outlier cluster or map to nearest
            topic_groups.setdefault(t_id, []).append(idx)

        results: List[TopicClusterResult] = []
        for t_id, group_indices in topic_groups.items():
            sub_embs = emb_matrix[group_indices]
            centroid = np.mean(sub_embs, axis=0).tolist()

            if topic_model is not None and t_id != -1 and t_id in topic_model.topic_representations_:
                rep = topic_model.get_topic(t_id)
                keywords = [word for word, score in rep[:5]]
                label = " ".join(keywords[:2]).title()
            else:
                # Heuristic naming from most frequent terms
                sample_docs = [documents[i] for i in group_indices]
                words = " ".join(sample_docs).lower().split()
                # Stop words removal
                from collections import Counter
                stop_words = {"the", "a", "an", "is", "in", "it", "to", "for", "and", "of", "on", "was", "my", "at", "with"}
                filtered = [w for w in words if len(w) > 3 and w not in stop_words]
                common = Counter(filtered).most_common(2)
                keywords = [w for w, _ in common] or ["General", "Feedback"]
                label = " ".join(keywords).title() or "General Feedback"

            # Compute internal cluster coherence (average cosine similarity to centroid)
            norm_centroid = centroid / (np.linalg.norm(centroid) + 1e-9)
            norm_sub = sub_embs / (np.linalg.norm(sub_embs, axis=1, keepdims=True) + 1e-9)
            coherence = float(np.mean(np.dot(norm_sub, norm_centroid)))

            results.append(
                TopicClusterResult(
                    topic_id=t_id,
                    label=label,
                    keywords=keywords,
                    indices=group_indices,
                    centroid=centroid,
                    coherence_score=round(max(0.1, min(0.99, coherence)), 3),
                )
            )

        return results
