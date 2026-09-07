"""Unit test for Emotion, Intent, and Urgency classifier."""
from app.ml.emotion_intent_urgency.classifier import EmotionIntentUrgencyClassifier


def test_emotion_intent_urgency():
    classifier = EmotionIntentUrgencyClassifier()

    sig1 = classifier.classify("Please fix this immediately, it is a critical emergency!", sentiment="negative")
    assert sig1.urgency == "high"
    assert sig1.method == "heuristic"

    sig2 = classifier.classify("I suggest we could add more charging stations in library.", sentiment="neutral")
    assert sig2.intent == "suggestion"

    sig3 = classifier.classify("Thank you for the wonderful lecture, greatly appreciated!", sentiment="positive")
    assert sig3.intent == "praise"
    assert sig3.emotion == "appreciation"
