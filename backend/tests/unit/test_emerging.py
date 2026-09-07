"""Unit tests for Emerging Issue Detector."""
from app.analytics.emerging import EmergingIssueDetector


def test_emerging_issue_minimum_sample_gate():
    detector = EmergingIssueDetector()
    # Below min_sample_size (5)
    state = detector.detect_state(daily_volumes=[1, 1, 1, 1], daily_negatives=[0, 1, 0, 1])
    assert state == "stable"


def test_emerging_issue_spike_protection():
    detector = EmergingIssueDetector()
    # Single-day extreme spike
    state = detector.detect_state(
        daily_volumes=[10, 10, 10, 10, 10, 50],
        daily_negatives=[1, 1, 1, 1, 1, 35],
    )
    assert state == "spike"


def test_emerging_issue_sustained_growth():
    detector = EmergingIssueDetector()
    # Sustained growth over window
    state = detector.detect_state(
        daily_volumes=[10, 12, 11, 20, 25, 30],
        daily_negatives=[2, 2, 3, 8, 10, 14],
    )
    assert state == "emerging"
