"""Unit test for sentiment classifier and fallback labeling."""
from app.ml.sentiment.classifier import SentimentClassifier


def test_sentiment_fallback_labeling():
    classifier = SentimentClassifier()
    # Force fallback mode to test explicit labeling rule
    classifier._fallback_mode = True
    classifier._initialized = True

    results = classifier.predict_batch([
        "The food quality was terrible and cold.",
        "The campus library was amazing and clean.",
        "Attended the class at 10 AM.",
    ])

    assert len(results) == 3
    assert results[0].sentiment == "negative"
    assert results[0].engine == "vader_fallback"  # RULES.md §4: strictly labeled as fallback
    assert results[1].sentiment == "positive"
    assert results[1].engine == "vader_fallback"
    assert results[2].sentiment == "neutral"
