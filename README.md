# InsightFlow (Feedback Intelligence OS)

> AI-Powered Feedback Intelligence OS — Smart India Hackathon (Problem Statement 1).  
> Transforming unstructured stakeholder feedback into explainable, evidence-grounded operational decisions.

---

## 1. Problem Statement (SIH PS1)

Organizations collect thousands of unstructured feedback entries across diverse touchpoints (surveys, support tickets, social channels, portals). Decision-makers face:
- **Noise and latency**: Critical issues stay buried under voluminous general feedback.
- **Ungrounded summaries**: Generic LLM summaries hallucinate or lack proof.
- **Lack of prioritization**: Unclear urgency or actionable next steps.

**InsightFlow** solves this with a strict architectural principle: **No Insight Without Evidence**. Every insight, KPI, and priority ranking links directly to raw source feedback items via immutable join relationships.

---

## 2. Core Architecture

```
┌────────────────────────────────────────────────────────┐
│               Frontend: Next.js Dashboard              │
│       (Overview / Issues / Themes / Trends / Actions)   │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON API (/api/v1)
┌───────────────────────────▼────────────────────────────┐
│              FastAPI Gateway & Domain Services         │
│     (Datasets / Insights / Issues / Feedback / Action) │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
┌─────────────▼───────────────┐ ┌─────────▼──────────────┐
│       ML / NLP Pipeline     │ │ Insight Engine         │
│  - RoBERTa Sentiment        │ │  - Priority Engine     │
│  - MiniLM-L6-v2 Embeddings  │ │  - Severity Scoring    │
│  - BERTopic / HDBSCAN       │ │  - Emerging Detector   │
│  - Aspect Analysis (ABSA)   │ │  - Driver Correlator   │
│  - Duplicate Clustering     │ │  - Change Comparator   │
└─────────────┬───────────────┘ └─────────┬──────────────┘
              │                           │
┌─────────────▼───────────────────────────▼──────────────┐
│                 PostgreSQL 16 + pgvector               │
│          (Relational Data + 384-dim Vectors)           │
│                 Redis 5+ (Cache & Queues)              │
└────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

- **Backend & API**: Python 3.11, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic
- **Machine Learning**: HuggingFace Transformers (`cardiffnlp/twitter-roberta-base-sentiment-latest`), Sentence-Transformers (`all-MiniLM-L6-v2`), BERTopic, HDBSCAN, Scikit-learn, PyTorch
- **Data & Storage**: PostgreSQL 16.2, `pgvector` 0.8.6, Redis 5+ / 7
- **Frontend** *(Track B)*: Next.js 16, TypeScript, TailwindCSS, ECharts / Lucide
- **LLM & Query** *(Track C)*: Local LLM (Ollama) / OpenAI BYOK with strict retrieval-grounded synthesis

---

## 4. Feature Status Matrix

| Component | Status | Description |
|---|---|---|
| **API Gateway & Envelopes** | **Implemented** | 16 contract-frozen endpoints under `/api/v1` with `{ data, meta, error }` |
| **Relational & Vector Schema** | **Implemented** | 10 entities with pgvector (384-dim) and `insight_evidence` join table |
| **Sentiment Analysis** | **Implemented** | CardiffNLP RoBERTa with deterministic `vader_fallback` fallback mode |
| **Aspect-Based Sentiment (ABSA)**| **Implemented** | Clause-level target extraction (Wi-Fi, cafeteria, library, hostel, etc.) |
| **Semantic Clustering & Topics** | **Implemented** | Sentence-Transformers + HDBSCAN + BERTopic keyword extraction |
| **Duplicate & Paraphrase Groups**| **Implemented** | Cosine similarity matrix ($\ge 0.88$) with connected-component clustering |
| **Emotion, Intent & Urgency** | **Implemented** | Granular intent, nuanced emotion, and operational urgency signals |
| **Deterministic Priority Engine**| **Implemented** | Exact weights from `analytics_config.yaml` ($0-100$) with penalty factor |
| **Emerging Issue Detector** | **Implemented** | Statistically gated growth detection with single-day spike protection |
| **Action Center Outcome Tracking**| **Implemented** | Pre-intervention baseline snapshot and post-resolution outcome tracking |
| **Frontend Web App** | **In Progress** | Next.js dashboard, issue radar, feedback explorer (Track B) |
| **LLM Natural Language Synthesis**| **Planned** | Track C grounded query response generation via Ollama / BYOK |

---

## 5. Repository Structure

```
InsightFlow/
├── backend/                       # Track A: Backend, ML, Analytics
│   ├── app/
│   │   ├── api/v1/                # FastAPI routers
│   │   ├── services/              # Domain & application services
│   │   ├── ml/                    # Sentiment, Embeddings, Topics, ABSA, Duplicates
│   │   ├── analytics/             # Priority, Severity, Emerging, Drivers, Compare
│   │   ├── db/                    # SQLAlchemy models & repositories
│   │   ├── jobs/                  # Ingestion & enrichment pipeline
│   │   ├── core/                  # Settings, Logging, Errors, Cache
│   │   └── schemas/               # Pydantic v2 schemas
│   ├── alembic/                   # Database migrations
│   ├── tests/                     # Contract, integration, and unit tests
│   └── pyproject.toml             # Backend dependencies (managed via uv)
├── frontend/                      # Track B: Next.js Dashboard (owned by PC 2)
├── infra/                         # Track C: Infrastructure & deployment (owned by PC 3)
├── docker/                        # Database initialization scripts
├── analytics_config.yaml          # Single source of truth for analytics parameters
├── API_CONTRACTS.md               # Frozen contract specifications
├── ARCHITECTURE.md                # System architecture documentation
├── CONTRIBUTING.md                # 3-PC Git and PR workflow guide
├── PRD.md                         # Product Requirements Document
├── RULES.md                       # Non-negotiable architectural rules
├── SETUP.md                       # Local environment setup instructions
└── docker-compose.yml             # Containerized services configuration
```

---

## 6. Three-Track Development Model

- **Track A (PC 1)**: Owns `backend/`, ML models, analytics engine, database schema.
- **Track B (PC 2)**: Owns `frontend/`, UI components, charts, and user flows.
- **Track C (PC 3)**: Owns `infra/`, container orchestration, and Track C LLM layer.

---

## 7. Quick Local Setup

### Backend (Track A)
```bash
cd backend
# 1. Install dependencies via uv
uv sync

# 2. Copy environment template
cp ../.env.example ../.env

# 3. Apply database migrations
uv run alembic upgrade head

# 4. Start backend server
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive API docs will be available at `http://localhost:8000/docs`.

### Run Automated Tests
```bash
cd backend
uv run pytest -v
```

---

## 8. Git & Team Branching Workflow

For full instructions on how teammates clone, branch, and open PRs, see **[CONTRIBUTING.md](CONTRIBUTING.md)**.
