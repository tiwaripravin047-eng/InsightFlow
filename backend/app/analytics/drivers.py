"""Correlation-based Driver Correlator."""
from typing import List, Dict, Any, Optional
import numpy as np
from scipy.stats import pearsonr
from app.core.config import get_settings


class DriverCorrelator:
    """Computes correlation between topic mentions and overall negative trends."""

    def __init__(self, config: Dict[str, Any] = None):
        if config is None:
            settings = get_settings()
            config = settings.analytics.get("driver_correlation", {})
        self.min_corr = float(config.get("min_correlation_threshold", 0.30))
        self.top_n = int(config.get("top_n_drivers", 3))

    def find_likely_drivers(
        self,
        overall_negative_series: List[int],
        topic_series_map: Dict[str, List[int]],
    ) -> List[Dict[str, Any]]:
        """Identify associated topic drivers based on Pearson correlation.
        NOTE: Outputs strictly 'likely_driver' / 'associated_issue' terminology. Never asserts causation.
        """
        if len(overall_negative_series) < 3:
            return []

        y = np.array(overall_negative_series, dtype=float)
        if np.std(y) == 0:
            return []

        drivers = []
        for topic_name, series in topic_series_map.items():
            if len(series) != len(overall_negative_series):
                continue
            x = np.array(series, dtype=float)
            if np.std(x) == 0:
                continue

            try:
                corr, _ = pearsonr(x, y)
                if not np.isnan(corr) and corr >= self.min_corr:
                    drivers.append({
                        "topic": topic_name,
                        "correlation_strength": round(float(corr), 2),
                    })
            except Exception:
                continue

        # Sort by correlation strength descending
        drivers.sort(key=lambda d: d["correlation_strength"], reverse=True)
        return drivers[: self.top_n]
