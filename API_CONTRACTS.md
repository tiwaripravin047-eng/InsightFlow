# API_CONTRACTS.md — Frontend ↔ Backend Contract

This is the frozen contract between Track B (frontend) and Track A (backend). Frontend builds against these shapes with mocked data; backend implements to match exactly. Any change here must be agreed by both tracks before merging (TASK_SPLIT.md — Conflict-Avoidance Rules).

All endpoints are versioned under `/api/v1`. All responses use the envelope from ARCHITECTURE.md §21:

```json
// success
{ "data": { ... }, "meta": { "pagination": { "limit": 50, "offset": 0, "total": 248 }, "generated_at": "2026-09-07T10:00:00Z" }, "error": null }

// error
{ "data": null, "error": { "code": "VALIDATION_ERROR", "message": "human-readable message" } }
```

## 1. Datasets

### `POST /api/v1/datasets`
Upload + register a dataset.
```json
// request: multipart/form-data — file + column_mapping JSON
{
  "column_mapping": {
    "text": "feedback_text",
    "timestamp": "created_at",
    "category": "department",
    "source": "channel",
    "rating": "score"
  },
  "name": "College Feedback Q3 2026",
  "domain": "college"
}
// response.data
{
  "dataset_id": "uuid",
  "job_id": "uuid",
  "status": "queued"
}
```

### `GET /api/v1/datasets/{id}/status`
```json
// response.data
{
  "status": "queued|processing|complete|failed",
  "progress_percent": 62,
  "current_stage": "topic_discovery",
  "rows_processed": 3100,
  "rows_total": 5000,
  "validation_summary": {
    "empty_text_rows": 4,
    "duplicate_rows": 12,
    "invalid_dates": 0
  },
  "error": null
}
```

## 2. Insights / Issue Radar

### `GET /api/v1/datasets/{id}/insights?sentiment=negative&category=Hostel&severity=high,critical&trend=rising&limit=20&offset=0`
```json
// response.data (array)
[
  {
    "id": "uuid",
    "title": "Food Quality is the fastest-growing negative issue this month",
    "topic_id": "uuid",
    "topic_label": "Food Quality",
    "sentiment": "negative",
    "severity": "high",
    "priority_score": 87,
    "priority_factors": {
      "sentiment_severity": 0.81,
      "normalized_frequency": 0.42,
      "growth_rate": 0.37,
      "recurrence": 0.55,
      "urgency_signal": 0.3
    },
    "trend": "rising",
    "change_percent": 37.0,
    "volume": 214,
    "unique_issue_count": 178,
    "affected_categories": ["Hostel", "Cafeteria"],
    "likely_drivers": [{ "topic": "Serving Temperature", "correlation_strength": 0.58 }],
    "recommended_actions": ["Investigate food serving temperature", "Review peak-hour serving process"],
    "confidence": 0.79,
    "confidence_factors": { "sample_size": 214, "topic_coherence": 0.71, "duplicate_ratio": 0.17 },
    "model_versions": { "sentiment": "roberta-sentiment-v1", "embedding": "minilm-l6-v2", "pipeline": "v1.2" },
    "generated_at": "2026-09-06T00:00:00Z"
  }
]
```

### `GET /api/v1/insights/{id}/evidence?limit=20&offset=0`
```json
// response.data
{
  "insight_id": "uuid",
  "evidence_count": 214,
  "representative_samples": [
    { "feedback_id": "uuid", "text": "food is cold every time by 7pm", "sentiment": "negative", "date": "2026-09-01" }
  ],
  "sentiment_distribution": { "negative": 0.81, "neutral": 0.14, "positive": 0.05 },
  "date_range": { "from": "2026-08-01", "to": "2026-09-06" },
  "filters_used": { "topic_id": "uuid", "dataset_id": "uuid" }
}
```

## 3. Issues (management view)
### `GET /api/v1/datasets/{id}/issues/{issue_id}`
```json
// response.data — superset of an Insight, plus workflow fields
{
  "...insight fields above...": "...",
  "description": "Multi-sentence generated description grounded in evidence",
  "affected_segments": ["Hostel A", "Hostel B"],
  "owner": null,
  "status": "open",
  "linked_actions": ["uuid"]
}
```

## 4. Themes
### `GET /api/v1/datasets/{id}/themes`
```json
// response.data (array, hierarchical)
[
  {
    "id": "uuid",
    "label": "Food",
    "volume": 620,
    "sentiment_breakdown": { "negative": 0.58, "neutral": 0.22, "positive": 0.2 },
    "trend": "rising",
    "sub_themes": [
      { "id": "uuid", "label": "Temperature", "volume": 214, "sentiment_breakdown": { "negative": 0.81 } },
      { "id": "uuid", "label": "Price", "volume": 90, "sentiment_breakdown": { "negative": 0.4 } }
    ]
  }
]
```

## 5. Feedback Explorer
### `GET /api/v1/datasets/{id}/feedback?sentiment=negative&topic_id=uuid&date_from=2026-08-01&date_to=2026-09-06&search=wifi&limit=50&offset=0`
```json
// response.data (array)
[
  {
    "id": "uuid",
    "text": "wifi keeps disconnecting in library",
    "sentiment": "negative",
    "sentiment_confidence": 0.92,
    "topic": "Wi-Fi",
    "aspects": [{ "aspect": "Wi-Fi", "sentiment": "negative", "confidence": 0.9 }],
    "emotion": "frustration",
    "intent": "complaint",
    "urgency": "medium",
    "severity": "high",
    "date": "2026-09-02",
    "category": "Library",
    "source": "survey",
    "language": "en"
  }
]
```
### `GET /api/v1/feedback/{id}` — full detail (adds `similar_feedback: [{feedback_id, similarity_score}]`, `related_issue_id`).

## 6. Trends / What Changed
### `GET /api/v1/datasets/{id}/trend?topic_id=uuid&window_days=30`
```json
{ "series": [{ "date": "2026-08-08", "volume": 12, "negative_ratio": 0.6 }, "..."] }
```
### `GET /api/v1/datasets/{id}/compare?period_a_start=2026-08-01&period_a_end=2026-08-31&period_b_start=2026-09-01&period_b_end=2026-09-06`
```json
// response.data
{
  "improved": [{ "topic": "Cafeteria", "change_percent": 12.0, "evidence_insight_id": "uuid" }],
  "worsened": [{ "topic": "Wi-Fi", "change_percent": 31.0, "evidence_insight_id": "uuid" }],
  "emerging": [{ "topic": "Parking", "first_seen": "2026-09-02", "volume": 14 }],
  "stable": [{ "topic": "Library", "change_percent": 1.2 }]
}
```

## 7. Actions (Action Center)
### `POST /api/v1/issues/{issue_id}/actions`
```json
// request
{ "title": "Inspect access-point coverage", "suggested_owner": "IT / Infrastructure", "priority": "high" }
// response.data
{ "id": "uuid", "issue_id": "uuid", "status": "open", "created_at": "..." }
```
### `PATCH /api/v1/actions/{id}`
```json
// request
{ "status": "resolved" }
// response.data
{ "id": "uuid", "status": "resolved", "resolved_at": "...", "outcome_before": null, "outcome_after": null }
```
Outcome fields populate asynchronously once the linked insight is regenerated after resolution (ARCHITECTURE.md §11).

## 8. Ask Feedback (NL Query)
### `POST /api/v1/datasets/{id}/query`
```json
// request
{ "question": "What got worse this week?" }
// response.data
{
  "answer": "Negative feedback increased 18% this week, primarily driven by Wi-Fi and cafeteria complaints.",
  "computed_data": { "change_percent": 18.0, "top_drivers": ["Wi-Fi", "Cafeteria"] },
  "evidence_insight_ids": ["uuid", "uuid"],
  "filters_applied": { "date_from": "2026-08-31", "date_to": "2026-09-06" },
  "answerable": true
}
```
If `answerable: false`, `answer` explains why the question can't be mapped to available data — frontend must render this distinctly from a normal answer, not as an error.

## 9. Export
### `GET /api/v1/datasets/{id}/export?format=csv&filters=...` — streams a file matching the currently applied filters only (RULES.md §10).

## Frontend Mocking Convention
Track B should place mock fixtures matching these exact shapes under `/lib/mocks/*.json` and swap to real `api-client` calls at each Integration Checkpoint (TASK_SPLIT.md). Do not invent field names not listed here — propose an addition to this file first.
