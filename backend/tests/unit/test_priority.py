"""Unit tests for the Priority Engine and edge cases."""
import pytest
from app.analytics.priority import PriorityEngine


def test_priority_engine_standard_calculation():
    engine = PriorityEngine()
    score, factors = engine.compute_priority(
        sentiment_severity=0.81,
        normalized_frequency=0.42,
        growth_rate=0.37,
        recurrence=0.55,
        urgency_signal=0.30,
        avg_confidence=0.79,
    )
    assert 0 <= score <= 100
    assert "sentiment_severity" in factors
    assert "growth_rate" in factors
    assert factors["sentiment_severity"] == 0.81


def test_priority_engine_zero_volume_edge_case():
    engine = PriorityEngine()
    score, factors = engine.compute_priority(
        sentiment_severity=0.0,
        normalized_frequency=0.0,
        growth_rate=0.0,
        recurrence=0.0,
        urgency_signal=0.0,
        avg_confidence=1.0,
    )
    assert score == 0
    assert factors["normalized_frequency"] == 0.0


def test_priority_engine_all_negative_critical_case():
    engine = PriorityEngine()
    score, factors = engine.compute_priority(
        sentiment_severity=1.0,
        normalized_frequency=1.0,
        growth_rate=1.0,
        recurrence=1.0,
        urgency_signal=1.0,
        avg_confidence=1.0,
    )
    assert score == 100


def test_priority_engine_confidence_penalty():
    engine = PriorityEngine()
    high_conf_score, _ = engine.compute_priority(
        sentiment_severity=0.8,
        normalized_frequency=0.5,
        growth_rate=0.5,
        recurrence=0.5,
        urgency_signal=0.5,
        avg_confidence=1.0,
    )
    low_conf_score, _ = engine.compute_priority(
        sentiment_severity=0.8,
        normalized_frequency=0.5,
        growth_rate=0.5,
        recurrence=0.5,
        urgency_signal=0.5,
        avg_confidence=0.1,
    )
    assert high_conf_score > low_conf_score
