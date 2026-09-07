"""Unit test for automated Action Center outcome tracking (ARCHITECTURE.md §11)."""
import uuid
import pytest
from app.db.session import SessionLocal
from app.db.models.dataset import Dataset
from app.db.models.topic import Topic, feedback_topics
from app.db.models.feedback import Feedback
from app.db.models.insight import Insight, insight_evidence
from app.db.models.issue import Issue
from app.schemas.action import ActionCreate, ActionUpdate
from app.services.action_service import ActionService


def test_action_outcome_tracking_lifecycle():
    db = SessionLocal()
    try:
        # Setup dataset
        dataset = Dataset(name="Test Outcome Dataset", domain="test")
        db.add(dataset)
        db.commit()
        db.refresh(dataset)

        # Setup topic
        topic = Topic(dataset_id=dataset.id, label="Wi-Fi Connectivity")
        db.add(topic)
        db.commit()
        db.refresh(topic)

        # Setup feedback items (3 negative, 1 positive)
        fb1 = Feedback(dataset_id=dataset.id, raw_text="Wifi down", sentiment="negative", sentiment_confidence=0.9)
        fb2 = Feedback(dataset_id=dataset.id, raw_text="Terrible wifi", sentiment="negative", sentiment_confidence=0.88)
        fb3 = Feedback(dataset_id=dataset.id, raw_text="Wifi disconnected again", sentiment="negative", sentiment_confidence=0.85)
        fb4 = Feedback(dataset_id=dataset.id, raw_text="Wifi is fast today", sentiment="positive", sentiment_confidence=0.82)
        db.add_all([fb1, fb2, fb3, fb4])
        db.commit()

        # Link feedback to topic
        for fb in [fb1, fb2, fb3, fb4]:
            db.execute(feedback_topics.insert().values(feedback_id=fb.id, topic_id=topic.id, distance_to_centroid=0.1))
        db.commit()

        # Setup Insight with evidence (negative severity = 0.75)
        insight = Insight(
            dataset_id=dataset.id,
            topic_id=topic.id,
            title="Wi-Fi connectivity failures",
            sentiment="negative",
            severity="high",
            priority_score=78,
            priority_factors={"sentiment_severity": 0.75, "growth_rate": 0.2},
            volume=4,
            unique_issue_count=4,
            confidence=0.86,
        )
        db.add(insight)
        db.commit()
        db.refresh(insight)

        # Link evidence (strictly required)
        for fb in [fb1, fb2, fb3]:
            db.execute(insight_evidence.insert().values(insight_id=insight.id, feedback_id=fb.id))
        db.commit()

        # Create Issue
        issue = Issue(
            dataset_id=dataset.id,
            insight_id=insight.id,
            title="Wi-Fi connectivity failures",
            status="open",
        )
        db.add(issue)
        db.commit()
        db.refresh(issue)

        # 1. Create Action via ActionService
        service = ActionService(db)
        create_data = ActionCreate(
            title="Upgrade Wi-Fi routers in Dorm A",
            suggested_owner="IT Infrastructure",
            priority="high",
        )
        action_res = service.create_action(issue_id=issue.id, data=create_data)
        assert action_res.status == "open"
        assert action_res.outcome_before == 0.75
        assert action_res.outcome_after is None
        assert action_res.resolved_at is None

        # 2. Update Action to resolved
        update_data = ActionUpdate(status="resolved")
        resolved_res = service.update_action(action_id=uuid.UUID(action_res.id), data=update_data)
        assert resolved_res.status == "resolved"
        assert resolved_res.resolved_at is not None
        assert resolved_res.outcome_before == 0.75
        # 3 out of 4 feedbacks are negative -> 0.75
        assert resolved_res.outcome_after == 0.75

        # 3. Add new post-resolution positive feedbacks to the topic
        fb5 = Feedback(dataset_id=dataset.id, raw_text="Wifi is amazing now", sentiment="positive", sentiment_confidence=0.95)
        fb6 = Feedback(dataset_id=dataset.id, raw_text="Super fast wifi after router upgrade", sentiment="positive", sentiment_confidence=0.92)
        db.add_all([fb5, fb6])
        db.commit()
        for fb in [fb5, fb6]:
            db.execute(feedback_topics.insert().values(feedback_id=fb.id, topic_id=topic.id, distance_to_centroid=0.1))
        db.commit()

        # 4. Recompute action outcome
        recomputed = service.recompute_action_outcome(action_id=uuid.UUID(action_res.id))
        assert recomputed is not None
        # Post-resolution feedbacks are fb5 and fb6, both positive -> negative ratio is 0.0!
        assert recomputed.outcome_after == 0.0

    finally:
        db.close()
