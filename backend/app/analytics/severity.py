"""Config-driven severity calculator."""
from typing import Dict, Any
from app.core.config import get_settings


class SeverityScorer:
    """Computes severity level (low, medium, high, critical) deterministically from config."""

    def __init__(self, config: Dict[str, Any] = None):
        if config is None:
            settings = get_settings()
            config = settings.analytics.get("severity_thresholds", {})
        self.critical_th = float(config.get("critical", 80.0))
        self.high_th = float(config.get("high", 60.0))
        self.medium_th = float(config.get("medium", 35.0))

    def calculate_severity(self, score: float) -> str:
        """Derive severity level from computed score (0-100)."""
        if score >= self.critical_th:
            return "critical"
        elif score >= self.high_th:
            return "high"
        elif score >= self.medium_th:
            return "medium"
        else:
            return "low"
