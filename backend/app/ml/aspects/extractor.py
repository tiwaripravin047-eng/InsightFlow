"""Aspect-based Sentiment Extraction (ABSA)."""
import re
from typing import List, Dict, Any, Optional
from app.ml.sentiment.classifier import SentimentClassifier


class AspectItemResult:
    def __init__(self, aspect: str, sentiment: str, confidence: float):
        self.aspect = aspect
        self.sentiment = sentiment
        self.confidence = confidence


class AspectExtractor:
    """Extracts candidate aspect phrases and evaluates sentiment per span."""

    # Common domain aspect anchor keywords
    DOMAIN_ASPECT_TARGETS = {
        "food", "meals", "cafeteria", "canteen", "mess", "breakfast", "dinner", "lunch", "snack",
        "wifi", "internet", "network", "connectivity", "speed", "router", "signal",
        "library", "books", "reading room", "study area",
        "hostel", "dorm", "room", "bathroom", "washroom", "cleanliness", "water", "electricity",
        "lab", "computer", "equipment", "hardware", "software",
        "faculty", "professor", "teacher", "lecture", "teaching", "staff", "management", "administration",
        "bus", "transport", "parking", "parking lot", "campus", "sports", "gym",
        "support", "service", "helpdesk", "billing", "fee", "portal", "website", "app"
    }

    def __init__(self, sentiment_classifier: Optional[SentimentClassifier] = None):
        self.classifier = sentiment_classifier or SentimentClassifier()

    def extract_aspects(self, text: str) -> List[AspectItemResult]:
        """Extract explicit aspects and compute clause-level sentiment."""
        if not text:
            return []

        # Split into clauses by punctuation and contrasting conjunctions
        clauses = [
            c.strip()
            for c in re.split(r"[,;.!?\n]+|\b(?:but|however|although|though|yet|while)\b", text, flags=re.IGNORECASE)
            if c.strip()
        ]
        if not clauses:
            clauses = [text.strip()]

        aspects_found: List[AspectItemResult] = []
        seen_aspects = set()

        for clause in clauses:
            c_lower = clause.lower()
            for target in self.DOMAIN_ASPECT_TARGETS:
                # Word boundary search for aspect target
                if re.search(rf"\b{re.escape(target)}\b", c_lower):
                    if target in seen_aspects:
                        continue
                    seen_aspects.add(target)

                    # Classify the specific clause where aspect appears
                    sent_res = self.classifier.predict_batch([clause])
                    if sent_res and sent_res[0].confidence >= 0.50:
                        aspects_found.append(
                            AspectItemResult(
                                aspect=target.title(),
                                sentiment=sent_res[0].sentiment,
                                confidence=sent_res[0].confidence,
                            )
                        )

        return aspects_found

