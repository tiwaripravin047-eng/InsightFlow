"""Sentiment Classifier module supporting Transformer-first inference with explicit fallback."""
from typing import List, Dict, Any, Optional
import torch
from app.core.config import get_settings
from app.core.logging import logger


class SentimentResult:
    def __init__(self, sentiment: str, confidence: float, engine: str):
        self.sentiment = sentiment  # positive, negative, neutral
        self.confidence = confidence
        self.engine = engine


class SentimentClassifier:
    """Transformer 3-class sentiment classifier with batched inference."""

    def __init__(self, model_name: Optional[str] = None, device: Optional[str] = None):
        settings = get_settings()
        self.model_name = model_name or settings.SENTIMENT_MODEL_NAME
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.pipeline = None
        self._initialized = False
        self._fallback_mode = False

    def _load_model(self) -> None:
        if self._initialized:
            return
        try:
            from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer

            logger.info("loading_sentiment_transformer", model=self.model_name, device=self.device)
            # Use device=0 for cuda if available, -1 for cpu
            device_idx = 0 if self.device == "cuda" else -1
            self.pipeline = pipeline(
                "sentiment-analysis",
                model=self.model_name,
                tokenizer=self.model_name,
                device=device_idx,
                top_k=None,  # return all label scores
                truncation=True,
                max_length=512,
            )
            self._initialized = True
            logger.info("sentiment_transformer_loaded", model=self.model_name)
        except Exception as exc:
            logger.warning("sentiment_transformer_load_failed", error=str(exc), msg="Enabling explicitly-labeled fallback engine")
            self._fallback_mode = True
            self._initialized = True

    def predict_batch(self, texts: List[str], batch_size: int = 32) -> List[SentimentResult]:
        """Classify a batch of feedback texts. Returns sentiment, confidence, and engine name."""
        if not texts:
            return []

        self._load_model()

        if self._fallback_mode or self.pipeline is None:
            return self._predict_fallback_batch(texts)

        results: List[SentimentResult] = []
        # Label mapping for cardiffnlp/twitter-roberta-base-sentiment-latest
        # typically: LABEL_0 -> negative, LABEL_1 -> neutral, LABEL_2 -> positive
        label_map = {
            "negative": "negative",
            "neutral": "neutral",
            "positive": "positive",
            "label_0": "negative",
            "label_1": "neutral",
            "label_2": "positive",
        }

        for i in range(0, len(texts), batch_size):
            chunk = texts[i : i + batch_size]
            try:
                raw_outputs = self.pipeline(chunk)
                for out in raw_outputs:
                    # Sort by score descending
                    sorted_scores = sorted(out, key=lambda x: x["score"], reverse=True)
                    top_label_raw = sorted_scores[0]["label"].lower()
                    top_score = float(sorted_scores[0]["score"])
                    sentiment = label_map.get(top_label_raw, "neutral")

                    results.append(
                        SentimentResult(
                            sentiment=sentiment,
                            confidence=round(top_score, 4),
                            engine=f"transformer:{self.model_name}",
                        )
                    )
            except Exception as exc:
                logger.warning("transformer_batch_inference_error", error=str(exc))
                # Fallback on batch failure
                results.extend(self._predict_fallback_batch(chunk))

        return results

    def _predict_fallback_batch(self, texts: List[str]) -> List[SentimentResult]:
        """Explicitly labeled fallback engine per RULES.md §4 and TECH_STACK.md §3."""
        # Check negative/positive sentiment words with deterministic heuristics
        results = []
        neg_words = {
            "bad", "terrible", "horrible", "worst", "poor", "broken", "dirty", "slow",
            "unhappy", "problem", "issue", "fail", "freeze", "crash", "stuck", "error",
            "disconnect", "noise", "cold", "smell", "rude", "useless", "expensive", "waste"
        }
        pos_words = {
            "good", "great", "excellent", "amazing", "love", "fast", "clean", "happy",
            "helpful", "polite", "best", "smooth", "perfect", "fresh", "friendly", "super"
        }

        for t in texts:
            lower = t.lower()
            tokens = set(lower.split())
            neg_count = sum(1 for w in neg_words if w in lower)
            pos_count = sum(1 for w in pos_words if w in lower)

            if neg_count > pos_count:
                sentiment = "negative"
                conf = min(0.95, 0.65 + (neg_count * 0.08))
            elif pos_count > neg_count:
                sentiment = "positive"
                conf = min(0.95, 0.65 + (pos_count * 0.08))
            else:
                sentiment = "neutral"
                conf = 0.50

            results.append(
                SentimentResult(
                    sentiment=sentiment,
                    confidence=round(conf, 4),
                    engine="vader_fallback",  # Strictly labeled as fallback
                )
            )
        return results
