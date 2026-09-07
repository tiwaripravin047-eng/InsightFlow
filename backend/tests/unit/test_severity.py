"""Unit tests for Severity classification."""
from app.analytics.severity import SeverityScorer


def test_severity_thresholds():
    scorer = SeverityScorer()
    assert scorer.calculate_severity(90.0) == "critical"
    assert scorer.calculate_severity(80.0) == "critical"
    assert scorer.calculate_severity(75.0) == "high"
    assert scorer.calculate_severity(60.0) == "high"
    assert scorer.calculate_severity(45.0) == "medium"
    assert scorer.calculate_severity(35.0) == "medium"
    assert scorer.calculate_severity(20.0) == "low"
    assert scorer.calculate_severity(0.0) == "low"
