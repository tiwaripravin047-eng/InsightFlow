"""Singleton Model Registry loading models once per process."""
import torch
from typing import Optional
from app.ml.sentiment.classifier import SentimentClassifier
from app.ml.embeddings.generator import EmbeddingGenerator
from app.ml.topics.discovery import TopicDiscoveryEngine
from app.ml.aspects.extractor import AspectExtractor
from app.ml.emotion_intent_urgency.classifier import EmotionIntentUrgencyClassifier
from app.ml.duplicates.detector import DuplicateDetector
from app.ml.language.detector import LanguageDetector
from app.core.logging import logger


class ModelRegistry:
    """Process-level singleton holding model instances."""

    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info("model_registry_init", device=self.device)
        self._sentiment_model: Optional[SentimentClassifier] = None
        self._embedding_model: Optional[EmbeddingGenerator] = None
        self._topic_model: Optional[TopicDiscoveryEngine] = None
        self._aspect_model: Optional[AspectExtractor] = None
        self._emotion_model: Optional[EmotionIntentUrgencyClassifier] = None
        self._duplicate_detector: Optional[DuplicateDetector] = None
        self._language_detector: Optional[LanguageDetector] = None

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

    def get_aspect_model(self) -> AspectExtractor:
        if self._aspect_model is None:
            self._aspect_model = AspectExtractor(sentiment_classifier=self.get_sentiment_model())
        return self._aspect_model

    def get_emotion_model(self) -> EmotionIntentUrgencyClassifier:
        if self._emotion_model is None:
            self._emotion_model = EmotionIntentUrgencyClassifier()
        return self._emotion_model

    def get_duplicate_detector(self) -> DuplicateDetector:
        if self._duplicate_detector is None:
            self._duplicate_detector = DuplicateDetector()
        return self._duplicate_detector

    def get_language_detector(self) -> LanguageDetector:
        if self._language_detector is None:
            self._language_detector = LanguageDetector()
        return self._language_detector


_registry_instance: Optional[ModelRegistry] = None


def get_model_registry() -> ModelRegistry:
    """Get process-level model registry."""
    global _registry_instance
    if _registry_instance is None:
        _registry_instance = ModelRegistry()
    return _registry_instance

