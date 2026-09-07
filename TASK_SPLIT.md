# TASK_SPLIT.md — Parallel Work Breakdown (3-PC Team)

This file exists so three people can work at the same time without blocking each other or duplicating logic. It maps directly to ARCHITECTURE.md's layering — each track owns a vertical slice with a clear interface to the others. Read PRD.md, TECH_STACK.md, ARCHITECTURE.md, and RULES.md before starting; this file only sequences the work.

## How the split works
- **Track A (Backend + ML/Analytics)** owns everything behind the API — pipeline, Insight Engine, DB.
- **Track B (Frontend/Dashboard)** owns everything the user sees — builds entirely against the API contract, not the real backend, until integration.
- **Track C (Data/Infra + Ask AI/LLM layer)** owns ingestion, demo data, deployment, and the LLM-grounded features (Executive Summary, Ask Feedback, Action recommendations).

The contract between A and B is **API_CONTRACTS.md** — B can build the entire UI against mocked responses matching that contract before A's real endpoints exist. This is what makes the three tracks genuinely parallel instead of sequential.

## Day 0 (all three, together — do not skip)
- Agree on `analytics_config.yaml` shape (priority score weights, severity thresholds, emerging-issue thresholds) — this is a shared contract.
- Agree on the Pydantic/TypeScript schema for `Insight`, `Feedback`, `Issue`, `Action` (ARCHITECTURE.md §9, §13) — freeze field names before splitting.
- Stand up `docker-compose up` locally (SETUP.md) so everyone has Postgres+pgvector+Redis running from hour one.

---

## Track A — Backend + ML/Analytics
**Owns:** `/app/api`, `/app/services`, `/app/ml`, `/app/analytics`, `/app/db`, `/app/jobs`

| Priority | Task | Depends On |
|---|---|---|
| P0 | DB schema + Alembic migrations (Dataset, Feedback, Topic, Insight, InsightEvidence, Action) | Day-0 schema freeze |
| P0 | CSV upload endpoint + validation (PRD.md §26) | schema |
| P0 | Sentiment classifier integration (transformer, batched) | — |
| P0 | Embedding + HDBSCAN/BERTopic topic discovery | sentiment |
| P0 | Severity/Priority Score engine (ARCHITECTURE.md §9), config-driven | topic discovery |
| P0 | Insight persistence + evidence linking (never create insight with 0 evidence — RULES.md §8) | priority engine |
| P0 | `GET /datasets/{id}/insights`, `GET /datasets/{id}/feedback` (filterable, paginated) | insight persistence |
| P1 | Aspect-based sentiment (spaCy span extraction + sentiment) | sentiment |
| P1 | Emotion/intent/urgency classifier | sentiment |
| P1 | Duplicate/near-duplicate clustering | embeddings |
| P1 | Emerging Issue Detector (statistical gating, ARCHITECTURE.md §9) | trend data present |
| P1 | Trend/"What Changed?" comparator endpoint | insight persistence |
| P2 | Driver Correlator (likely-driver, correlation-labeled) | trend + topic data |
| P2 | Action Center endpoints (`POST /issues/{id}/actions`, `PATCH /actions/{id}`) | insight persistence |
| P2 | Outcome tracking (before/after on resolved actions, ARCHITECTURE.md §11) | actions |

**Definition of done for every task**: matches RULES.md §19, has unit tests, response validated against Pydantic schema.

---

## Track B — Frontend / Dashboard
**Owns:** `/app` (Next.js routes), `/components`, `/lib`

Build against **mocked API responses matching API_CONTRACTS.md** — do not wait for Track A's real endpoints.

| Priority | Task | Depends On |
|---|---|---|
| P0 | Dashboard shell + navigation (Overview/Issues/Themes/Trends/Feedback/Actions/Ask AI) | design tokens (Track C) |
| P0 | Upload flow UI (upload → column mapping → preview → validation report → processing progress) | API_CONTRACTS.md upload spec |
| P0 | KPI cards + Executive Summary panel | API_CONTRACTS.md insights spec |
| P0 | Issue Radar table (ranked, filterable) | same |
| P0 | Feedback Explorer (searchable/filterable table + detail drawer) | API_CONTRACTS.md feedback spec |
| P0 | Evidence drill-down component (shared, reused everywhere — RULES.md §2) | API_CONTRACTS.md evidence spec |
| P1 | Sentiment-over-time chart + Issue Trend Matrix (bubble) | ECharts setup |
| P1 | Themes page (theme → sub-theme hierarchy) | API_CONTRACTS.md themes spec |
| P1 | Global filter bar (URL-synced) | — |
| P2 | Action Center UI (status kanban-style, before/after outcome display) | API_CONTRACTS.md actions spec |
| P2 | Ask Feedback chat UI | API_CONTRACTS.md query spec |
| P2 | Empty/loading/error states for every panel (RULES.md §13) | ongoing, not deferred silently |

**Definition of done for every task**: no component >200 lines, no data-fetching inside chart components, loading/error/empty states implemented, accessible (RULES.md §13).

---

## Track C — Data/Infra + LLM Layer
**Owns:** demo data, `docker-compose`, deployment config, LLM-grounded features

| Priority | Task | Depends On |
|---|---|---|
| P0 | `docker-compose.yml` for local dev (Postgres+pgvector, Redis, api, worker) | — |
| P0 | Realistic synthetic demo dataset (~5,000 rows: positive/negative/neutral/mixed, repeated complaints, emerging issues, multiple categories, realistic language, spelling variation) | — |
| P0 | `.env.example` with all required variables documented | Track A config needs |
| P1 | Executive Summary LLM prompt (grounded — receives real computed data, must not invent numbers, RULES.md §7) | Track A insights endpoint |
| P1 | Action recommendation phrasing (LLM, labeled "AI-suggested") | Track A action endpoint |
| P1 | Topic naming assist (LLM names a cluster from top terms) | Track A topic endpoint |
| P2 | Ask Feedback query translation (NL question → structured filter/aggregation call) + grounded answer composition | Track A query endpoint, Track B chat UI |
| P2 | Deployment config (production docker-compose, CDN/edge frontend config) | — |
| P2 | Observability setup (structlog config, optional Prometheus endpoint) | — |

**Definition of done for every task**: no LLM call ever asked to produce a number that should come from the analytics layer (RULES.md §7, §20).

---

## Integration Checkpoints
- **Checkpoint 1** (after each track's P0 list): wire Track B's UI to Track A's real endpoints, replacing mocks. Verify against API_CONTRACTS.md — any drift is a contract violation, fix the contract file first, then the code.
- **Checkpoint 2** (after P1): full pipeline run against Track C's demo dataset end-to-end; verify every Issue Radar entry has evidence (RULES.md §8).
- **Checkpoint 3** (after P2): full demo flow rehearsal against PRD.md §30 Hackathon Demo Flow, timed.

## Conflict-Avoidance Rules
- Only Track A edits `/app/api`, `/app/services`, `/app/ml`, `/app/analytics`, `/app/db` — Track B never edits backend code, and vice versa.
- Shared config (`analytics_config.yaml`, Pydantic/TS schema field names) changes go through a quick sync message to all three tracks before merging — these are the only files all tracks depend on simultaneously.
- If a track needs a field the API contract doesn't have yet, add it to API_CONTRACTS.md first (propose, don't just build against an assumed shape) — this prevents Track B and Track A silently diverging.
