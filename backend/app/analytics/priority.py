"""Config-driven deterministic Priority Score engine."""
from typing import Dict, Any, Tuple
from app.core.config import get_settings


class PriorityEngine:
    """Computes explainable Priority Scores and factor breakdowns."""

    def __init__(self, config: Dict[str, Any] = None):
        if config is None:
            settings = get_settings()
            config = settings.analytics.get("priority_score", {})
        
        weights = config.get("weights", {})
        self.w1 = float(weights.get("w1_sentiment_severity", 0.35))
        self.w2 = float(weights.get("w2_normalized_frequency", 0.20))
        self.w3 = float(weights.get("w3_growth_rate", 0.20))
        self.w4 = float(weights.get("w4_recurrence", 0.15))
        self.w5 = float(weights.get("w5_urgency_signal", 0.10))
        self.penalty_multiplier = float(config.get("confidence_penalty_multiplier", 0.20))
        self.scale = float(config.get("scale", 100.0))

    def compute_priority(
        self,
        sentiment_severity: float,   # 0.0 - 1.0
        normalized_frequency: float, # 0.0 - 1.0
        growth_rate: float,          # 0.0 - 1.0
        recurrence: float,           # 0.0 - 1.0
        urgency_signal: float,       # 0.0 - 1.0
        avg_confidence: float,       # 0.0 - 1.0
    ) -> Tuple[int, Dict[str, float]]:
        """Calculate final priority score (0-100) and factor breakdown."""
        # Clamp inputs to [0.0, 1.0]
        s_sev = max(0.0, min(1.0, float(sentiment_severity)))
        n_freq = max(0.0, min(1.0, float(normalized_frequency)))
        g_rate = max(0.0, min(1.0, float(growth_rate)))
        rec = max(0.0, min(1.0, float(recurrence)))
        urg = max(0.0, min(1.0, float(urgency_signal)))
        conf = max(0.0, min(1.0, float(avg_confidence)))

        raw_score = (
            (self.w1 * s_sev)
            + (self.w2 * n_freq)
            + (self.w3 * g_rate)
            + (self.w4 * rec)
            + (self.w5 * urg)
            - (self.penalty_multiplier * (1.0 - conf))
        )

        final_score = int(round(max(0.0, min(1.0, raw_score)) * self.scale))

        factors = {
            "sentiment_severity": round(s_sev, 2),
            "normalized_frequency": round(n_freq, 2),
            "growth_rate": round(g_rate, 2),
            "recurrence": round(rec, 2),
            "urgency_signal": round(urg, 2),
        }

        return final_score, factors
