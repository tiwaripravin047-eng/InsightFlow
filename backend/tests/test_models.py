"""Tests for Database Models and Schema Definitions."""

import uuid
from datetime import datetime, timezone
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import Base, Dataset, Feedback, Topic, Insight, Action, insight_evidence


def test_models_schema_and_relationships():
    """Verify models instantiate and relationships function in memory."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Create Dataset
    ds = Dataset(name="Test University Feedback", domain="college")
    session.add(ds)
    session.commit()
    assert ds.id is not None

    # Create Feedback
    fb = Feedback(
        dataset_id=ds.id,
        raw_text="The library Wi-Fi dropped while studying",
        sentiment="negative",
        sentiment_confidence=0.88,
        category="Library",
    )
    session.add(fb)
    session.commit()

    # Create Topic
    topic = Topic(dataset_id=ds.id, label="Wi-Fi Reliability", coherence_score=0.79)
    session.add(topic)
    session.commit()

    # Create Insight with linked Evidence
    insight = Insight(
        dataset_id=ds.id,
        topic_id=topic.id,
        title="Wi-Fi Reliability is the leading complaint in Library",
        sentiment="negative",
        severity="high",
        priority_score=82,
        volume=1,
    )
    insight.evidence_items.append(fb)
    session.add(insight)
    session.commit()

    # Create Action
    action = Action(
        insight_id=insight.id,
        title="Inspect library access point hardware",
        suggested_owner="IT Infrastructure",
        priority=2,
    )
    session.add(action)
    session.commit()

    # Verify queries and linkages
    loaded_insight = session.query(Insight).filter_by(id=insight.id).first()
    assert loaded_insight is not None
    assert len(loaded_insight.evidence_items) == 1
    assert loaded_insight.evidence_items[0].raw_text == "The library Wi-Fi dropped while studying"
    assert len(loaded_insight.actions) == 1
    assert loaded_insight.actions[0].status == "open"
