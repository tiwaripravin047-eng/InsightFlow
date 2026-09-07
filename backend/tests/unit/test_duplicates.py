"""Unit test for Duplicate Detection."""
from app.ml.duplicates.detector import DuplicateDetector


def test_duplicate_clustering():
    detector = DuplicateDetector(similarity_threshold=0.85)

    # 3 items: two identical, one orthogonal
    embeddings = [
        [1.0, 0.0, 0.0],
        [0.99, 0.01, 0.0],  # near-duplicate of 1st
        [0.0, 1.0, 0.0],   # distinct
    ]

    clusters, dup_ratio, unique_count = detector.find_duplicate_clusters(embeddings)
    assert len(clusters) == 3
    assert clusters[0] == clusters[1]  # Grouped into same cluster
    assert clusters[0] != clusters[2]  # Different cluster
    assert unique_count == 2
    assert dup_ratio > 0.0
