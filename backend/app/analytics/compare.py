"""Period comparison ('What Changed?') engine."""
from datetime import datetime
from typing import Dict, Any, List, Optional
import uuid
from sqlalchemy import func, case
from sqlalchemy.orm import Session
from app.db.models.feedback import Feedback
from app.db.models.topic import Topic, feedback_topics
from app.db.models.insight import Insight


class ChangeComparator:
    """Computes real period comparison metrics."""

    def __init__(self, db: Session):
        self.db = db

    def compare_periods(
        self,
        dataset_id: uuid.UUID,
        period_a_start: datetime,
        period_a_end: datetime,
        period_b_start: datetime,
        period_b_end: datetime,
    ) -> Dict[str, Any]:
        """Aggregate feedback per topic for period A and period B to compute changes."""
        # Helper to get topic negative counts for a period
        def get_period_stats(p_start: datetime, p_end: datetime):
            rows = (
                self.db.query(
                    Topic.id,
                    Topic.label,
                    func.count(Feedback.id).label("total_vol"),
                    func.sum(case((Feedback.sentiment == "negative", 1), else_=0)).label("neg_vol"),
                    func.min(Feedback.feedback_ts).label("first_ts"),
                )

                .join(feedback_topics, Topic.id == feedback_topics.c.topic_id)
                .join(Feedback, feedback_topics.c.feedback_id == Feedback.id)
                .filter(Feedback.dataset_id == dataset_id)
                .filter(Feedback.feedback_ts >= p_start, Feedback.feedback_ts <= p_end)
                .group_by(Topic.id, Topic.label)
                .all()
            )
            return {r.id: (r.label, r.total_vol or 0, r.neg_vol or 0, r.first_ts) for r in rows}

        stats_a = get_period_stats(period_a_start, period_a_end)
        stats_b = get_period_stats(period_b_start, period_b_end)

        improved = []
        worsened = []
        emerging = []
        stable = []

        all_topic_ids = set(stats_a.keys()) | set(stats_b.keys())

        for t_id in all_topic_ids:
            # Check for linked insight if exists
            insight = (
                self.db.query(Insight)
                .filter(Insight.dataset_id == dataset_id, Insight.topic_id == t_id)
                .first()
            )
            evidence_id = str(insight.id) if insight else None

            if t_id not in stats_a and t_id in stats_b:
                # Newly emerging in period B
                label, vol_b, neg_b, first_ts = stats_b[t_id]
                emerging.append({
                    "topic": label,
                    "first_seen": str(first_ts.date()) if first_ts else str(period_b_start.date()),
                    "volume": vol_b,
                })
            elif t_id in stats_a and t_id in stats_b:
                label, vol_a, neg_a, _ = stats_a[t_id]
                _, vol_b, neg_b, _ = stats_b[t_id]

                neg_ratio_a = neg_a / vol_a if vol_a > 0 else 0.0
                neg_ratio_b = neg_b / vol_b if vol_b > 0 else 0.0

                if neg_ratio_a > 0:
                    diff_pct = round(((neg_ratio_b - neg_ratio_a) / neg_ratio_a) * 100.0, 1)
                else:
                    diff_pct = round(neg_ratio_b * 100.0, 1)

                if diff_pct >= 15.0:
                    worsened.append({
                        "topic": label,
                        "change_percent": abs(diff_pct),
                        "evidence_insight_id": evidence_id,
                    })
                elif diff_pct <= -15.0:
                    improved.append({
                        "topic": label,
                        "change_percent": abs(diff_pct),
                        "evidence_insight_id": evidence_id,
                    })
                else:
                    stable.append({
                        "topic": label,
                        "change_percent": abs(diff_pct),
                    })

        return {
            "improved": improved,
            "worsened": worsened,
            "emerging": emerging,
            "stable": stable,
        }
