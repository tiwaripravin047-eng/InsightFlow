"""Contract tests validating response envelopes and shapes against API_CONTRACTS.md."""
import io
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.models.dataset import Dataset
from app.db.models.feedback import Feedback
from app.db.models.insight import Insight
from app.db.models.issue import Issue


client = TestClient(app)


def test_health_contract():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    body = res.json()
    assert "data" in body
    assert "meta" in body
    assert body["error"] is None
    assert "status" in body["data"]
    assert "database" in body["data"]
    assert "pgvector" in body["data"]


def test_error_envelope_contract():
    # Calling an invalid dataset status returns standard error envelope
    bad_id = str(uuid.uuid4())
    res = client.get(f"/api/v1/datasets/{bad_id}/status")
    assert res.status_code == 404
    body = res.json()
    assert body["data"] is None
    assert "error" in body
    assert body["error"]["code"] == "DATASET_NOT_FOUND"
    assert "message" in body["error"]


def test_api_endpoints_contract_with_dataset():
    db = SessionLocal()
    try:
        # Create minimal test dataset with insight and evidence
        dataset = Dataset(
            name="Contract Test Dataset",
            domain="college",
            column_mapping={"text": "feedback_text"},
            total_rows=1,
        )
        db.add(dataset)
        db.flush()

        fb = Feedback(
            dataset_id=dataset.id,
            raw_text="Food was cold and bad",
            sentiment="negative",
            sentiment_confidence=0.9,
            category="Cafeteria",
            source="survey",
        )
        db.add(fb)
        db.flush()

        from app.db.repositories.insight_repo import InsightRepository
        from app.db.repositories.issue_repo import IssueRepository
        insight_repo = InsightRepository(db)
        issue_repo = IssueRepository(db)

        ins = insight_repo.create(
            dataset_id=dataset.id,
            title="Food Quality is the fastest-growing negative issue",
            sentiment="negative",
            severity="high",
            priority_score=87,
            priority_factors={
                "sentiment_severity": 0.81,
                "normalized_frequency": 0.42,
                "growth_rate": 0.37,
                "recurrence": 0.55,
                "urgency_signal": 0.30,
            },
            evidence_feedback_ids=[fb.id],
            trend="rising",
            change_percent=37.0,
            volume=1,
            unique_issue_count=1,
            affected_categories=["Cafeteria"],
            likely_drivers=[{"topic": "Serving Temperature", "correlation_strength": 0.58}],
            recommended_actions=["Investigate food serving temperature"],
            confidence=0.79,
            confidence_factors={"sample_size": 1, "topic_coherence": 0.71, "duplicate_ratio": 0.17},
            model_versions={"sentiment": "roberta-sentiment-v1", "embedding": "minilm-l6-v2", "pipeline": "v1.2"},
        )

        issue = issue_repo.create_from_insight(
            insight=ins,
            description="Multi-sentence generated description grounded in evidence",
            affected_segments=["Cafeteria"],
        )

        d_id = str(dataset.id)
        ins_id = str(ins.id)
        iss_id = str(issue.id)

        # 1. GET /api/v1/datasets/{id}/insights
        res = client.get(f"/api/v1/datasets/{d_id}/insights")
        assert res.status_code == 200
        body = res.json()
        assert body["error"] is None
        assert isinstance(body["data"], list)
        assert len(body["data"]) > 0
        first_insight = body["data"][0]
        assert "priority_factors" in first_insight
        assert "sentiment_severity" in first_insight["priority_factors"]
        assert "likely_drivers" in first_insight
        assert "model_versions" in first_insight
        assert "confidence_factors" in first_insight

        # 2. GET /api/v1/insights/{id}/evidence
        res = client.get(f"/api/v1/insights/{ins_id}/evidence")
        assert res.status_code == 200
        ev_body = res.json()
        assert ev_body["error"] is None
        assert "representative_samples" in ev_body["data"]
        assert "sentiment_distribution" in ev_body["data"]
        assert "filters_used" in ev_body["data"]

        # 3. GET /api/v1/datasets/{id}/issues/{issue_id}
        res = client.get(f"/api/v1/datasets/{d_id}/issues/{iss_id}")
        assert res.status_code == 200
        iss_body = res.json()
        assert iss_body["error"] is None
        assert iss_body["data"]["status"] == "open"
        assert "affected_segments" in iss_body["data"]

        # 4. GET /api/v1/datasets/{id}/feedback
        res = client.get(f"/api/v1/datasets/{d_id}/feedback")
        assert res.status_code == 200
        fb_body = res.json()
        assert fb_body["error"] is None
        assert len(fb_body["data"]) > 0

        # 5. GET /api/v1/datasets/{id}/trend
        res = client.get(f"/api/v1/datasets/{d_id}/trend?window_days=30")
        assert res.status_code == 200
        trend_body = res.json()
        assert trend_body["error"] is None
        assert "series" in trend_body["data"]

        # 6. POST /api/v1/issues/{issue_id}/actions
        res = client.post(f"/api/v1/issues/{iss_id}/actions", json={"title": "Fix food heating", "suggested_owner": "Cafeteria Manager", "priority": "high"})
        assert res.status_code == 201
        act_body = res.json()
        assert act_body["error"] is None
        act_id = act_body["data"]["id"]

        # 7. PATCH /api/v1/actions/{id}
        res = client.patch(f"/api/v1/actions/{act_id}", json={"status": "resolved"})
        assert res.status_code == 200
        patch_body = res.json()
        assert patch_body["error"] is None
        assert patch_body["data"]["status"] == "resolved"

        # 8. POST /api/v1/datasets/{id}/query
        res = client.post(f"/api/v1/datasets/{d_id}/query", json={"question": "What got worse this week?"})
        assert res.status_code == 200
        q_body = res.json()
        assert q_body["error"] is None
        assert "answer" in q_body["data"]
        assert "answerable" in q_body["data"]
    finally:
        db.close()
