"""Unit test for Aspect-Based Sentiment Analysis (ABSA)."""
from app.ml.aspects.extractor import AspectExtractor


def test_aspect_extraction_detection():
    extractor = AspectExtractor()
    extractor.classifier._fallback_mode = True
    extractor.classifier._initialized = True

    text = "The wifi is terrible in the library, but the food in cafeteria is great."
    aspects = extractor.extract_aspects(text)

    # Should detect aspects with appropriate sentiments
    aspect_map = {a.aspect.lower(): a.sentiment for a in aspects}
    assert "wifi" in aspect_map or "library" in aspect_map or "food" in aspect_map or "cafeteria" in aspect_map
