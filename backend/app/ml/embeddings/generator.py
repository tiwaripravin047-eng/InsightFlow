"""Sentence embeddings generator with normalized text-hash caching."""
import hashlib
from typing import List, Dict, Optional
import numpy as np
import torch
from sentence_transformers import SentenceTransformer
from app.core.config import get_settings
from app.core.logging import logger


class EmbeddingGenerator:
    """Generates 384-dimensional sentence embeddings with in-memory text hash caching."""

    def __init__(self, model_name: Optional[str] = None, device: Optional[str] = None):
        settings = get_settings()
        self.model_name = model_name or settings.EMBEDDING_MODEL_NAME
        self.dimension = settings.EMBEDDING_DIMENSION
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model: Optional[SentenceTransformer] = None
        self._cache: Dict[str, List[float]] = {}
        self._initialized = False

    def _load_model(self) -> None:
        if self._initialized:
            return
        try:
            logger.info("loading_sentence_transformer", model=self.model_name, device=self.device)
            self.model = SentenceTransformer(self.model_name, device=self.device)
            self._initialized = True
            logger.info("sentence_transformer_loaded", model=self.model_name)
        except Exception as exc:
            logger.error("embedding_model_load_error", error=str(exc))
            raise

    @staticmethod
    def hash_text(text: str) -> str:
        """Normalized hash of feedback text."""
        norm = " ".join(text.strip().lower().split())
        return hashlib.sha256(norm.encode("utf-8")).hexdigest()

    def generate_batch(self, texts: List[str], batch_size: int = 64) -> List[List[float]]:
        """Generate normalized embeddings for a list of texts, using cache when available."""
        if not texts:
            return []

        self._load_model()
        results: List[Optional[List[float]]] = [None] * len(texts)
        texts_to_encode: List[str] = []
        indices_to_encode: List[int] = []

        # Check cache first
        for idx, text in enumerate(texts):
            h = self.hash_text(text)
            if h in self._cache:
                results[idx] = self._cache[h]
            else:
                texts_to_encode.append(text)
                indices_to_encode.append(idx)

        # Encode remaining texts
        if texts_to_encode and self.model is not None:
            raw_embeddings = self.model.encode(
                texts_to_encode,
                batch_size=batch_size,
                normalize_embeddings=True,
                show_progress_bar=False,
            )

            for text, orig_idx, emb in zip(texts_to_encode, indices_to_encode, raw_embeddings):
                emb_list = emb.tolist()
                h = self.hash_text(text)
                self._cache[h] = emb_list
                results[orig_idx] = emb_list

        return [r if r is not None else [0.0] * self.dimension for r in results]
