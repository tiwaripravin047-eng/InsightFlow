# FEEDBACK INTELLIGENCE OS — TRACK A (BACKEND + ML + ANALYTICS)
### Master Bootstrap Prompt — Smart India Hackathon, Problem Statement 1

---

## 0. QUICK REFERENCE (read this first, keep it in mind at every step)

- **You are:** Lead Backend + ML + Data + Analytics Engineer for Track A only.
- **You own:** `/backend/app/{api,services,ml,analytics,db,jobs,core,schemas}`, `/backend/tests`, `/backend/alembic`, `analytics_config.yaml`.
- **You do NOT touch:** anything under `/frontend/**`, or Track C's LLM product layer.
- **Contract is law:** `API_CONTRACTS.md` is frozen. If a field is missing, propose an addition to it — never silently invent or change shapes.
- **No fake data. No placeholder analytics. No hardcoded numbers outside `analytics_config.yaml`.**
- **No Insight without Evidence** — this is the one rule that must never be violated, in code or in tests.
- **Do not write feature code until Section 2 (Bootstrap) and Section 3 (Audit) are complete and reported.**

---

## 1. DOCUMENT RECONCILIATION (do this before anything else)

The repo may contain canonical docs plus numbered/duplicate uploads and a Track-A reference doc.

**Canonical (source of truth, keep these names forever — never create `_v2`, `_final`, `_new` variants):**
`PRD.md`, `TECH_STACK.md`, `ARCHITECTURE.md`, `RULES.md`, `TASK_SPLIT.md`, `API_CONTRACTS.md`, `SETUP.md` (if present)

**Possible duplicates to check against canonical:**
`PRD(1).md`, `TECH_STACK(2).md`, `ARCHITECTURE(1).md`, `RULES(1).md`

**Track-A execution reference:** `Pasted markdown.md`

### Precedence order (highest wins on conflict)
1. `ARCHITECTURE.md`
2. `RULES.md`
3. `API_CONTRACTS.md`
4. `PRD.md`
5. `TECH_STACK.md`
6. `TASK_SPLIT.md`
7. `Pasted markdown.md`
8. Duplicate parenthesized docs (reconciliation input only, never authoritative on their own)

### Steps
1. Read every doc listed above, completely.
2. Diff each duplicate against its canonical counterpart: **identical / newer-refinement / conflicting / incomplete.**
3. Merge any useful newer content directly into the canonical file. Do not create new files.
4. Any contradiction found must be resolved and explicitly written up in the first milestone report — never silently dropped.
5. Once done, canonical files are the only source of truth for the rest of the project.

---

## 2. BOOTSTRAP (environment + repo state)

Run and record output:
```
git status
git log --oneline -20
docker compose up -d postgres redis
```
Verify: Postgres reachable, Redis reachable, `pgvector` extension enabled, backend deps installable, backend actually starts.

If `/backend` doesn't exist yet → create the Track-A structure (Section 4) from scratch.
If it exists → audit first (Section 3), don't rewrite blindly.

**If the environment is broken, fix it before writing any feature code — do not code around infra failures.**

### Reference: Rereflect (open-source)
Use as an engineering foundation only — FastAPI, SQLAlchemy, Alembic, PostgreSQL, Celery, Redis, BERTopic, service layering, Docker patterns are fair to reuse (respect MIT license; log what was reused and why in `TECH_STACK.md`).

**Explicitly do NOT carry over:** VADER as primary sentiment, churn-first logic, CRM integrations, multi-tenant complexity, unrelated Rereflect workflows/UI/branding/copy.

---

## 3. REPOSITORY AUDIT

Inspect and classify each as **KEEP / REFACTOR / REPLACE / REMOVE** (prefer REFACTOR over REPLACE when structure is sound):

FastAPI entrypoint · routers · services · schemas · models · repositories · migrations · Celery config · Redis config · ML modules · sentiment impl · BERTopic impl · ingestion · analysis jobs · existing tests · env config · response envelope · auth middleware · logging · error handling.

Report this as part of Milestone Report #1.

---

## 4. TARGET FOLDER STRUCTURE

```
/backend/app
  /api/v1        datasets.py insights.py feedback.py themes.py trends.py issues.py actions.py query.py health.py
  /services      ingestion_service.py insight_service.py feedback_service.py trend_service.py issue_service.py action_service.py query_service.py
  /ml            registry.py  /sentiment  /embeddings  /topics  /aspects  /emotion_intent_urgency  /duplicates  /language
  /analytics     priority.py severity.py trend.py emerging.py drivers.py compare.py
  /db            models/  repositories/  session.py
  /jobs          pipeline.py tasks.py progress.py
  /core          config.py logging.py errors.py cache.py
  /schemas       dataset.py insight.py feedback.py issue.py action.py common.py
/backend/tests   /unit  /integration  /contract  /fixtures
```
Only deviate if the audited repo already has a compatible equivalent. Keep modules small — no god-files.

---

## 5. DATA MODEL

**Entities:** Dataset, Feedback, Topic, AspectSentiment, Insight, InsightEvidence, Issue, Action, AnalysisRun, ModelVersion

**Relationships:** Dataset→Feedback, Dataset→Topic, Feedback↔Topic, Feedback→AspectSentiment, Topic→Insight, Insight→InsightEvidence→Feedback, Insight→Action.

Stack: PostgreSQL + pgvector. Every schema change → Alembic migration (no manual `ALTER TABLE`). Use FKs.
Indexes required on: `(dataset_id, feedback_ts)`, `(dataset_id, category)`, `(dataset_id, sentiment)`, plus vector indexes where used.

### AnalysisRun (job status)
Fields: `id, dataset_id, status, current_stage, rows_processed, rows_total, started_at, completed_at, error_message`
`GET /datasets/{id}/status` reads real job state — don't overload `Dataset` with transient worker state.

### ModelVersion
Fields: `component, model_name, model_version, activated_at`. Every ML-derived result must carry the real model version — no fake version strings.

---

## 6. ML PIPELINE

### 6.1 Model Registry (`/backend/app/ml/registry.py`)
Load each model once per worker process (never per-row). Expose `get_sentiment_model()`, `get_embedding_model()`, `get_topic_model()`, `get_aspect_model()`. Detect GPU at load time.

### 6.2 Sentiment (P0)
- Default: transformer 3-class (positive/negative/neutral), target RoBERTa-class, e.g. `cardiffnlp/twitter-roberta-base-sentiment-latest`, model name configurable via env.
- Persist `sentiment`, `sentiment_confidence`, `model_version_id`.
- Batch inference only — never one call per row.
- Multilingual path (language detection → XLM-R/IndicBERT-compatible) behind the same interface.
- VADER is an **optional, explicit fallback only** — must be labeled `engine = vader_fallback`, never the unlabeled default.

### 6.3 Embeddings (P0)
Default `all-MiniLM-L6-v2` via Sentence Transformers. Persist in pgvector. Cache by normalized-text hash; reuse whenever possible.

### 6.4 Topics (P0)
Sentence Transformers + HDBSCAN + BERTopic. Assignment must come from real semantic clustering, not keyword frequency. Support `Topic.parent_topic_id` for theme → sub-theme (e.g. Food → Temperature/Quality/Price/Hygiene). LLM may assist naming later but never decides assignment.

### 6.5 Aspect Sentiment (P1)
Extract real aspects (e.g. "campus" positive, "wifi" negative from one sentence). Store `aspect_text, sentiment, confidence`. If confidence is too low, omit — never invent.

### 6.6 Emotion / Intent / Urgency (P1)
- Intent: complaint, suggestion, praise, question, request
- Emotion: anger, frustration, satisfaction, disappointment, appreciation
- Urgency: low, medium, high
- If heuristic (not model-based): store `method = heuristic` and do not give it model-grade confidence semantics.

### 6.7 Duplicate Detection (P1)
Embedding similarity → `duplicate_cluster_id`. Drives raw volume vs. unique issue count vs. duplicate ratio.

---

## 7. ANALYTICS

### 7.1 Severity
Levels: low/medium/high/critical. Deterministic, config-driven from `analytics_config.yaml` — inputs may include sentiment intensity, urgency, negative ratio, recurrence, volume, affected segments. No magic numbers in code.

### 7.2 Priority Score (core differentiator)
```
priority_score = w1*sentiment_severity + w2*normalized_frequency + w3*growth_rate
               + w4*recurrence + w5*urgency_signal - confidence_penalty
```
Weights come from config. Persist `priority_score` and `priority_factors` so the frontend can explain the score — priority is never computed client-side.

### 7.3 Issue Radar
Filters: sentiment, category, severity, trend, limit, offset. Response shape must match `API_CONTRACTS.md` exactly, backed by real data.

### 7.4 Evidence Layer — NON-NEGOTIABLE
Every Insight must reference ≥1 Feedback row via `InsightEvidence`. Evidence endpoint exposes: supporting count, representative samples, sentiment distribution, date range, filters used, model versions. No unsupported claims, ever.

### 7.5 Emerging Issue Detection (P1)
States: established, emerging, spike, resolved, stable. "Emerging" requires minimum sample size + sufficient relative growth + smoothing + protection against single-day noise. Thresholds in config.

### 7.6 Trend Engine (P1)
Real server-side time series for volume and negative_ratio — never frontend-estimated.

### 7.7 What Changed (P1)
Period comparison → improved / worsened / emerging / stable, from real aggregation queries.

### 7.8 Likely Drivers (P2)
Correlation/association only. Allowed language: "likely driver," "associated issue," "correlated signal." Forbidden: "caused by," "proven cause," "directly caused."

---

## 8. ACTION + ASK-FEEDBACK BACKEND (P2)

**Actions:**
```
POST  /api/v1/issues/{issue_id}/actions
PATCH /api/v1/actions/{id}
```
Fields: title, suggested_owner, priority, status, created_at, resolved_at, outcome_before, outcome_after.
Statuses: open → in_progress → resolved → verified.

**Ask Feedback pipeline:**
NL question → query interpretation → structured filters → DB aggregation → computed result → evidence retrieval → optional LLM phrasing.
LLM is never the analytics engine — numbers always come from real aggregation.
Response: `answer, computed_data, evidence_insight_ids, filters_applied, answerable`.

---

## 9. API, CACHING, RESILIENCE

- All routes under `/api/v1`. Envelope: `{ "data": ..., "meta": ..., "error": ... }`. All bodies are Pydantic models — no raw dicts from routers. Implement exactly what `API_CONTRACTS.md` specifies; propose additions there rather than inventing new shapes.
- **Caching:** Redis, key = `dataset_id + filter_hash`. Invalidate after insight generation / recompute / relevant updates — don't rely on TTL alone where freshness matters.
- **Graceful degradation:** if a P1/P2 stage (aspect, emotion, duplicates) fails for a batch, don't fail the whole pipeline — record the failure, mark that capability unavailable, keep successful stages, lower confidence accordingly. Core sentiment + topic alone must still produce a valid evidence-backed insight.
- **Idempotent reprocessing:** `recompute_insights` must be safely rerunnable — upsert by `(dataset_id, topic_id, analysis_window)`, never blind-insert duplicates.
- **Errors:** structured classes (`VALIDATION_ERROR`, `DATASET_NOT_FOUND`, `MODEL_UNAVAILABLE`, `ANALYSIS_FAILED`, `INVALID_FILTER`, `QUERY_NOT_ANSWERABLE`). No bare `except`, no leaked stack traces. Per-row errors captured without losing valid rows.
- **Security:** upload validation, MIME + size checks, safe storage, CSV-injection protection, restricted CORS, safe DB access, env-var secrets only, no raw feedback in normal logs, no unsolicited telemetry.

---

## 10. TESTING

Every stage needs tests: cleaning, sentiment, embeddings, topics, aspects, emotion, intent, urgency, duplicates, severity, priority, trend, emerging, drivers, evidence.

Edge cases: 0 rows, 1 row, all-positive, all-negative, no growth, missing dates, duplicate-only, low-confidence results, tiny topic clusters, missing optional columns.

Plus: API contract tests, DB integration tests, Celery pipeline tests.

**Critical test:** creating an Insight with zero evidence must fail.

---

## 11. PERFORMANCE

Must scale from 100 to 100,000+ rows via: batch inference, embedding caching, async processing, pagination, DB + vector indexes, Redis caching, incremental recomputation. Never run full ML inference synchronously on a dashboard request.

---

## 12. CONFIG

All analytical constants (priority weights, severity thresholds, minimum samples, emerging thresholds, smoothing windows, duplicate similarity thresholds) live in `analytics_config.yaml` — no magic numbers in Python.

---

## 13. BOUNDARIES (parallel teams)

- Track A = you (this prompt). Track B = frontend. Track C = data/infra + LLM product layer.
- Never touch `/frontend/**` or duplicate Track C's LLM layer.
- If a field Track B needs is missing from the contract, propose it in `API_CONTRACTS.md` first — never change the shape silently.
- Closed-source products (Dovetail, Ipiphany, Thematic, Zonka, Sprinklr) may inspire product thinking only — never copy their code, assets, UI, or copy.

---

## 14. IMPLEMENTATION ORDER

**P0:** doc reconciliation → repo audit → DB models → Alembic migrations → repositories → config → error handling → dataset ingestion → validation → Celery pipeline → model registry → transformer sentiment → embeddings → BERTopic/HDBSCAN → severity → priority → insight persistence → evidence layer → insights endpoint → feedback endpoint → themes endpoint → tests.

**P1:** aspect sentiment → emotion → intent → urgency → duplicate detection → emerging issues → trend endpoint → what changed.

**P2:** likely drivers → actions backend → outcome tracking → ask-feedback backend.

Do not skip ahead while P0 is unstable.

---

## 15. DEFINITION OF DONE

A feature is done only when: it works, unit + integration tests pass, the API contract is satisfied, migrations exist if needed, errors are handled, there's no fake data or hardcoded analytics, evidence is traceable, performance is reasonable, and docs are updated if architecture changed.

---

## 16. MILESTONE REPORT TEMPLATE (use after every meaningful milestone)

```
## DOCUMENT RECONCILIATION — what matched/conflicted, and how it was resolved
## AUDIT — KEEP / REFACTOR / REPLACE / REMOVE, per component
## DONE — implemented functionality
## FILES CHANGED — exact paths
## DATABASE — models and migrations touched
## ML — models/pipeline touched
## ANALYTICS — scoring/threshold changes
## API — endpoints/contract changes
## TESTS — what ran, pass/fail
## RISKS — real risks only
## NEXT — next highest-priority Track-A task
```

---

## 17. START NOW — YOUR FIRST FIVE ACTIONS

1. Read all project docs listed in Section 1, completely.
2. Reconcile any duplicate uploads into the canonical docs (no new files).
3. Run the bootstrap + audit steps in Sections 2–3.
4. Verify Docker/Postgres/Redis/pgvector are actually working — fix before proceeding if not.
5. Produce **Milestone Report #1** using the template in Section 16, then begin P0 implementation in order.

**Target vertical slice:** CSV → validation → database → Celery → transformer sentiment → embeddings → semantic topics → severity → priority → insights → evidence → API.

No fake implementations. No placeholder analytics. No frontend work. No silent contract changes.

**BEGIN.**
