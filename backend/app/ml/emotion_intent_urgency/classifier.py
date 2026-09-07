"""Emotion, Intent, and Urgency classification module."""
from typing import Dict, Any, List


class GranularSignals:
    def __init__(self, intent: str, emotion: str, urgency: str, method: str = "heuristic"):
        self.intent = intent      # complaint, suggestion, praise, question, request
        self.emotion = emotion    # anger, frustration, satisfaction, disappointment, appreciation, neutral
        self.urgency = urgency    # low, medium, high
        self.method = method      # heuristic or model


class EmotionIntentUrgencyClassifier:
    """Classifies nuanced intent, emotion, and operational urgency signals."""

    # Lexical triggers for intents
    INTENT_TRIGGERS = {
        "question": ["why", "how", "what", "when", "where", "who", "?", "is it possible"],
        "suggestion": ["suggest", "recommend", "idea", "could improve", "better if", "feature", "would be nice"],
        "request": ["please provide", "request", "need", "require", "can we have", "give us"],
        "praise": ["great job", "thank you", "kudos", "appreciate", "wonderful", "excellent", "best"],
    }

    # Lexical triggers for emotions
    EMOTION_TRIGGERS = {
        "anger": ["furious", "unacceptable", "disaster", "terrible", "outrageous", "ridiculous", "horrible"],
        "disappointment": ["expected better", "disappointed", "disappointing", "letdown", "sad", "fell short"],
        "frustration": ["annoying", "keeps failing", "sick of", "tired of", "again and again", "never works", "frustrating"],
        "appreciation": ["grateful", "thankful", "blessed", "shoutout", "much appreciated", "greatly appreciated", "appreciated", "appreciate", "thank you", "thanks"],
        "satisfaction": ["pleased", "satisfied", "content", "smooth", "helpful", "good", "great", "love", "awesome"],
    }

    # Urgency signals
    URGENCY_TRIGGERS = {
        "high": ["immediately", "asap", "urgent", "danger", "hazard", "critical", "emergency", "severe", "blocker"],
        "medium": ["soon", "quick", "affecting", "trouble", "issue", "problem", "delay"],
    }

    def classify(self, text: str, sentiment: str = "neutral") -> GranularSignals:
        """Classify intent, emotion, and urgency from text and sentiment."""
        lower = text.lower()

        # Intent detection
        intent = "complaint" if sentiment == "negative" else ("praise" if sentiment == "positive" else "neutral")
        for int_name, triggers in self.INTENT_TRIGGERS.items():
            if any(t in lower for t in triggers):
                intent = int_name
                break

        # Emotion detection
        emotion = "neutral"
        if sentiment == "negative":
            emotion = "frustration"  # Default negative emotion
        elif sentiment == "positive":
            emotion = "satisfaction"  # Default positive emotion

        # Check explicit emotion triggers
        for emo_name in ["anger", "disappointment", "frustration", "appreciation", "satisfaction"]:
            if any(t in lower for t in self.EMOTION_TRIGGERS[emo_name]):
                emotion = emo_name
                break

        # Urgency detection
        urgency = "low"
        for urg_level in ["high", "medium"]:
            if any(t in lower for t in self.URGENCY_TRIGGERS[urg_level]):
                urgency = urg_level
                break

        return GranularSignals(
            intent=intent,
            emotion=emotion,
            urgency=urgency,
            method="heuristic",  # Explicitly labeled as heuristic per RULES.md §4
        )
