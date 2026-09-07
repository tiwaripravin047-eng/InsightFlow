"""Singleton Model Registry loading models once per process."""
import torch
from typing import Optional
from app.ml.sentiment.classifier import SentimentClassifier
from app.ml.embeddings.generator import EmbeddingGenerator
from app.ml.topics.discovery import TopicDiscoveryEngine
from app.core.logging import logger


class ModelRegistry:
    """Process-level singleton holding model instances."""

    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info("model_registry_init", device=self.device)
        self._sentiment_model: Optional[SentimentClassifier] = None
        self._embedding_model: Optional[EmbeddingGenerator] = None
        self._topic_model: Optional[TopicDiscoveryEngine] = None

    def get_sentiment_model(self) -> SentimentClassifier:
        if self._sentiment_model is None:
            self._sentiment_model = SentimentClassifier(device=self.device)
        return self._sentiment_model

    def get_embedding_model(self) -> EmbeddingGenerator:
        if self._embedding_model is None:
            self._embedding_model = EmbeddingGenerator(device=self.device)
        return self._embedding_model

    def get_topic_model(self) -> TopicDiscoveryEngine:
        if self._topic_model is None:
            self._topic_model = TopicDiscoveryEngine()
        return self._topic_model


_registry_instance: Optional[ModelRegistry] = None


def get_model_registry() -> ModelRegistry:
    """Get process-level model registry."""
    global _registry_instance
    if _registry_instance is None:
        _registry_instance = ModelRegistry()
    return _registry_instance
