"""Statistically gated Emerging Issue Detector."""
from typing import List, Dict, Any
import numpy as np
from app.core.config import get_settings


class EmergingIssueDetector:
    """Classifies topic state as established, emerging, spike, resolved, or stable."""

    def __init__(self, config: Dict[str, Any] = None):
        if config is None:
            settings = get_settings()
            config = settings.analytics.get("emerging_issues", {})
        self.min_samples = int(config.get("min_sample_size", 5))
        self.growth_th = float(config.get("relative_growth_threshold", 0.25))
        self.smoothing_window = int(config.get("smoothing_window_days", 7))
        self.spike_multiplier = float(config.get("spike_multiplier", 2.5))

    def detect_state(self, daily_volumes: List[int], daily_negatives: List[int]) -> str:
        """Detect issue emergence state."""
        total_vol = sum(daily_volumes)
        total_neg = sum(daily_negatives)

        # Gate 1: Minimum sample size
        if total_neg < self.min_samples:
            return "stable"

        if len(daily_negatives) < 4:
            return "stable"

        # Check for single-day spike protection (RULES.md §6: no single-day spike is labeled emerging)
        arr = np.array(daily_negatives, dtype=float)
        baseline = arr[:-1]
        mean_val = float(np.mean(baseline)) if len(baseline) > 0 else arr[0]
        std_val = float(np.std(baseline)) if len(baseline) > 0 else 0.0

        is_isolated_last_day = (len(arr) >= 3 and arr[-2] <= (mean_val + max(std_val, 1.0)))
        spike_threshold = max(std_val * self.spike_multiplier, mean_val * self.spike_multiplier, 5.0)

        if (arr[-1] - mean_val) > spike_threshold and is_isolated_last_day:
            return "spike"


        # Evaluate windowed growth
        half = len(daily_negatives) // 2
        prev_sum = sum(daily_negatives[:half])
        recent_sum = sum(daily_negatives[half:])

        if prev_sum == 0:
            growth = 1.0 if recent_sum >= self.min_samples else 0.0
        else:
            growth = (recent_sum - prev_sum) / prev_sum

        if growth >= self.growth_th and recent_sum >= self.min_samples:
            if total_vol > 150:
                return "established"
            return "emerging"
        elif growth <= -self.growth_th:
            return "resolved"
        else:
            return "established" if total_vol > 100 else "stable"
