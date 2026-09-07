# TECH_STACK.md — Feedback Intelligence OS

## 1. Rereflect — Current Stack (Audit)
Verified from the public repo (`github.com/haqaliz/rereflect`, MIT license):

| Layer | Rereflect Today |
|---|---|
| Frontend | Next.js 16, TypeScript 5.9, TailwindCSS 3.4, shadcn/ui, Recharts |
| Backend | FastAPI 0.115, SQLAlchemy 2.0, Alembic, PostgreSQL, JWT auth |
| Async | Celery 5.3, Redis |
| ML/NLP | VADER (default, free, zero-cost path), scikit-learn, BERTopic, optional local transformer sentiment (opt-in, CPU), OpenAI/Anthropic/Google BYOK for LLM-grade analysis |
| Services | `frontend-web`, `backend-api`, `analysis-engine`, `worker-service` (Celery) |
| Product framing | Multi-tenant SaaS-style feedback tool: sentiment, pain points, feature requests, churn risk, Kanban workflow, CRM/issue-tracker integrations, RBAC |

Rereflect is a mature, genuinely useful open-source project — but it is **customer-feedback/churn-framed**, not PS1's domain-agnostic feedback-intelligence framing, and its default sentiment path is lexicon-based (VADER), not transformer-based.

## 2. Decision Framework Applied
| Component | Decision | Why |
|---|---|---|
| Next.js + TS + Tailwind + shadcn/ui | **KEEP** | Solid, matches our own independent stack choice; production-credible |
| Recharts | **EXTEND** (add Apache ECharts alongside) | Recharts is fine for KPI/sentiment-over-time; the Issue Trend Matrix (bubble chart, frequency×severity) is better served by ECharts |
| FastAPI + SQLAlchemy + Alembic + Postgres | **KEEP** | Directly matches our target backend; async-first, migration-managed |
| Celery + Redis | **KEEP** | Matches our async processing requirement exactly |
| VADER as default sentiment | **REPLACE** as the primary path | PS1 and RULES.md explicitly forbid lexicon-based sentiment as the primary engine. Rereflect's own docs are transparent that VADER is the free/offline default and score honestly against a labeled set when a transformer is opted in — we adopt that honesty principle but make the transformer path the default output shown as "AI analysis," and keep VADER only as an optional zero-cost degraded mode, clearly labeled. |
| scikit-learn | **KEEP** (supporting role) | Useful for lightweight classifiers/utility (e.g., duplicate ratio heuristics), not the core sentiment/topic engine |
| BERTopic | **KEEP + EXTEND** | Rereflect already validates BERTopic works on this stack for pain-point/feature-request clustering; we extend it into full theme→sub-theme hierarchy + aspect-level output |
| JWT auth / multi-tenant RBAC | **DEFER** (schema-reserved, not built for hackathon) | Out of PRD scope for the hackathon rebuild (see Non-Goals); reserved in schema so it's not a rewrite later |
| CRM/issue-tracker/Slack/Intercom integrations | **REMOVE from hackathon scope** | Not required by PS1; would dilute focus from the Insight Engine, which is the actual differentiator |
| Churn risk scoring / playbooks | **REMOVE from hackathon scope, CONCEPT REUSED** | Churn scoring's underlying pattern (deterministic score + evidence + human-reviewed suggestions) is directly reused as the model for our Priority Score and Action Center |

## 3. Target Stack

### Frontend
| Tech | Why |
|---|---|
| **Next.js (App Router) 16 + React + TypeScript (strict)** | Matches Rereflect's validated choice; fast dashboard loads, clean nested routing for the Overview/Issues/Themes/Trends/Feedback/Actions/Ask-AI IA |
| **Tailwind CSS** | Utility-first design-token discipline for the required premium/minimal design system |
| **shadcn/ui** | Accessible unstyled primitives, themed ourselves — avoids the explicitly-ruled-out "generic Bootstrap admin" look |
| **Apache ECharts** (primary, complex charts) + **Recharts** (simple KPI sparklines) | ECharts handles the Issue Trend Matrix (bubble chart) and dense time-series interactions; Recharts is lighter for trivial KPI charts. Both proven compatible with this stack via Rereflect's existing Recharts usage |

### Backend
| Tech | Why |
|---|---|
| **FastAPI + Pydantic v2** | Async-first, schema-validated everywhere — directly enforces "no fake analytics" (RULES.md) |
| **SQLAlchemy 2.0 + Alembic** | Matches Rereflect's validated ORM/migration approach; no schema drift |

### ML / NLP
| Component | Model/Library | Why This, Not Alternatives |
|---|---|---|
| Sentiment (primary/default) | **RoBERTa-based 3-class classifier** (e.g., `cardiffnlp/twitter-roberta-base-sentiment-latest`, swappable) via `transformers` | Modern transformer, not lexicon-based — required by PS1/RULES.md; CPU-feasible for hackathon inference; swappable to DeBERTa-v3 or a domain-fine-tuned checkpoint |
| Sentiment (optional degraded mode) | **VADER** | Retained only as an explicitly-labeled, zero-cost offline fallback (Rereflect precedent), never the default "AI analysis" result |
| Multilingual (SHOULD) | **XLM-R / IndicBERT** behind the same interface | Activated only when language detection finds non-English content |
| Embeddings | **Sentence-Transformers** (`all-MiniLM-L6-v2` default) | Fast, validated general-purpose embeddings for clustering and duplicate detection at hackathon scale |
| Topic/sub-topic discovery | **BERTopic (HDBSCAN + c-TF-IDF) over sentence embeddings** | Rereflect already proves BERTopic is stable on this exact stack; extended here into a theme→sub-theme hierarchy rather than a flat pain-point list |
| Keyword extraction (topic labeling support) | **KeyBERT** | Cheap, embedding-based support for topic naming/validation |
| Aspect-based sentiment | spaCy dependency-parse span extraction + sentiment classifier applied per span | Produces real aspect-level output without needing a bespoke ABSA-labeled training set |
| Emotion/Intent/Urgency | Lightweight classification head (fine-tunable transformer or rules-assisted heuristic layer), degradable | Rereflect's urgency-flag precedent is extended into a fuller emotion/intent taxonomy |
| Duplicate/near-duplicate detection | Cosine similarity over Sentence-Transformer embeddings | Reuses existing embeddings, no extra model needed |
| Language detection | fastText `lid.176` or `langdetect` | Lightweight gate for the multilingual path |

**Model versioning**: every classification/insight record stores model name + version + pipeline version + config, matching Rereflect's precedent of an accuracy card comparing methods honestly.

### LLM Usage
Bring-your-own-key (OpenAI/Anthropic/Google), matching Rereflect's BYOK pattern, or a local/offline model (Ollama or OpenAI-compatible endpoint) for a zero-cost path. LLM calls restricted to: executive summaries, action-recommendation phrasing, topic naming, "Ask Feedback" answer composition. Never used to produce a metric that should come from the analytics layer (RULES.md §17).

### Database
| Tech | Why |
|---|---|
| **PostgreSQL** | Matches Rereflect's validated choice; relational integrity for feedback/topic/issue/insight/action relationships |
| **pgvector extension** | Adds embedding storage co-located with relational data — Rereflect doesn't currently use a vector store; this is our extension for duplicate detection and future semantic search, chosen over a separate vector DB to avoid an extra operational component at hackathon scale |

### Vector/Embedding Storage
`pgvector` columns on `feedback` and `topic_centroids` — avoids standing up Pinecone/Weaviate for a dataset scale (≤ ~100K rows) that doesn't need a dedicated ANN service.

### Queue / Cache
| Tech | Why |
|---|---|
| **Redis** | Matches Rereflect; caches dashboard aggregates and NL-query translations |
| **Celery** | Matches Rereflect; runs the ML pipeline as background jobs with progress reporting |

### Infrastructure
Docker + docker-compose (Rereflect's own deployment pattern proves this works end-to-end for this exact stack — frontend, backend, worker, Postgres, Redis together). Object storage abstraction (local FS for hackathon demo, S3-compatible interface for production) for uploaded raw CSVs.

### Development Tooling
ESLint + Prettier (frontend); ruff + black + mypy (backend); pnpm (frontend, matches Rereflect); uv/poetry (backend) with locked versions.

### Testing
pytest (backend pipeline/formula unit + integration tests); Vitest + React Testing Library (frontend); contract tests validating API responses against Pydantic models / generated TS types.

### Observability
structlog JSON logging (no raw feedback text above DEBUG); FastAPI middleware latency metrics; optional Prometheus endpoint; per-pipeline-stage timing captured per batch run.

### Security
Env vars / secret manager for all secrets (Rereflect precedent: encrypted-at-rest BYOK keys, zero telemetry by default — we adopt the same zero-telemetry, no-phone-home posture); upload MIME/size/row validation; CSV-injection sanitization; CORS restricted to deployed frontend origin(s); no arbitrary code execution from uploaded content.

## 4. What Stays / What Changes / What Is Replaced
| Category | Items |
|---|---|
| **Stays** | Next.js/TS/Tailwind/shadcn/ui frontend base, FastAPI/SQLAlchemy/Alembic/Postgres backend base, Celery+Redis async layer, BERTopic as the topic-discovery core, Docker Compose deployment pattern, BYOK/offline-LLM philosophy, zero-telemetry posture |
| **Changes** | Sentiment path (transformer becomes default, VADER becomes labeled fallback), topic output (flat pain-points → theme/sub-theme hierarchy + aspect-level sentiment), analytics framing (churn-risk-centric → issue-priority-centric), charting (Recharts-only → Recharts + ECharts for the trend matrix) |
| **Added** | pgvector, Issue Radar, Priority Score engine, Evidence Layer (structured, not just a feedback-list drill-down), Emerging Issue statistical gating, "What Changed?" comparison engine, Action Center outcome tracking, root-cause/likely-driver surfacing |
| **Removed from hackathon scope** | Multi-tenant RBAC, CRM/issue-tracker/Slack/Intercom/Zendesk integrations, churn-specific playbooks/outreach email — all reserved as roadmap items, not deleted as concepts |

## 5. Local Development Requirements
Docker + docker-compose; Node.js 20+, pnpm; Python 3.11+, uv/poetry; ~4GB RAM minimum for CPU transformer inference (batch size tuned accordingly); GPU optional, auto-detected.

## 6. Production Deployment Architecture
Frontend: containerized/edge deployment behind CDN. Backend API: containerized FastAPI behind a load balancer, stateless, horizontally scalable. Celery workers: separately scaled pool by queue depth. Postgres + pgvector: managed instance with PgBouncer pooling. Redis: managed instance, separate logical DBs for cache vs. broker. Object storage: S3-compatible bucket, lifecycle policy for retention limits.

## 7. Trade-offs
- **pgvector vs dedicated vector DB**: simpler ops at the cost of ANN performance at very large scale; acceptable at the stated ≤100K+ row target.
- **HDBSCAN/BERTopic vs LLM-based clustering**: deterministic, reproducible, cheap at scale; directly supports "LLM never invents metrics."
- **CPU-feasible model sizes vs largest available models**: traded for hackathon-demo latency; explicit upgrade path noted in Roadmap.
- **Keeping VADER as an optional fallback vs removing it entirely**: Rereflect's honest zero-cost/offline mode is a genuine value (works with no API key); we preserve that option but never let it be the default labeled "AI sentiment" result.

## 8. Alternatives Considered
- **Elasticsearch** — rejected for MVP; Postgres full-text search + pgvector covers Feedback Explorer search and similarity.
- **MongoDB** — rejected; feedback/topic/issue/insight/action relationships are inherently relational.
- **Streamlit/Gradio** — rejected; doesn't meet the premium enterprise SaaS UX bar (Dovetail-level target).
- **TextBlob/VADER as primary sentiment** — explicitly excluded per PS1/RULES.md; VADER retained only as a labeled optional fallback, per §3 above.
- **Pinecone/Weaviate** — rejected for hackathon scale; revisit if dataset scale grows an order of magnitude beyond 100K rows.

## 9. Open-Source Reference Policy Compliance
| Reference | Repository | License | What Was Reused | Why |
|---|---|---|---|---|
| Rereflect | `github.com/haqaliz/rereflect` | MIT | Architecture pattern (Next.js + FastAPI + Celery/Redis + Postgres), BERTopic-based topic discovery pattern, BYOK/offline-LLM philosophy, zero-telemetry posture, Docker Compose deployment shape, honest-benchmarking-card concept for sentiment methods | Proven, permissively-licensed, exact-stack precedent; validated the architecture is implementable by a small team |
| Dovetail, Ipiphany, Thematic, Zonka, Sprinklr | Proprietary, closed-source | N/A | **No code, assets, or UI reused.** Only publicly described product/UX *patterns* (evidence-first insights, priority ranking, theme hierarchy, granular signals, detect→assign→verify workflow) were used as conceptual inspiration for our own independent implementation | Public product literature only; no proprietary implementation accessed or copied |

No proprietary code, screenshots, branding, or copy from any referenced closed-source product appears anywhere in this codebase or documentation.
