"""Trend computation engine."""
from typing import List, Dict, Any, Tuple


class TrendEngine:
    """Computes trend direction (rising, declining, stable) from time series data."""

    @staticmethod
    def evaluate_trend(series: List[Dict[str, Any]]) -> Tuple[str, float]:
        """Compute trend and percentage change between recent and previous periods."""
        if not series or len(series) < 2:
            return "stable", 0.0

        halfway = len(series) // 2
        first_half = series[:halfway]
        second_half = series[halfway:]

        first_vol = sum(p.get("volume", 0) for p in first_half)
        second_vol = sum(p.get("volume", 0) for p in second_half)

        first_neg = sum(p.get("volume", 0) * p.get("negative_ratio", 0.0) for p in first_half)
        second_neg = sum(p.get("volume", 0) * p.get("negative_ratio", 0.0) for p in second_half)

        first_neg_ratio = first_neg / first_vol if first_vol > 0 else 0.0
        second_neg_ratio = second_neg / second_vol if second_vol > 0 else 0.0

        if first_neg_ratio > 0:
            change_pct = round(((second_neg_ratio - first_neg_ratio) / first_neg_ratio) * 100.0, 1)
        else:
            change_pct = round(second_neg_ratio * 100.0, 1) if second_neg_ratio > 0 else 0.0

        if change_pct >= 15.0:
            trend_label = "rising"
        elif change_pct <= -15.0:
            trend_label = "declining"
        else:
            trend_label = "stable"

        return trend_label, change_pct
