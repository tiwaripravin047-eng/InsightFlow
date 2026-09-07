# SETUP.md — Local Development Setup

Get all three tracks (TASK_SPLIT.md) running on identical local environments in one pass.

## 1. Prerequisites
- Docker + Docker Compose
- Node.js 20+, pnpm (`corepack enable` or `npm i -g pnpm`)
- Python 3.11+, uv (`pip install uv`) or poetry
- ~4GB free RAM for CPU transformer inference

## 2. Clone & Configure
```bash
git clone <repo-url>
cd feedback-intelligence-os
cp .env.example .env
```
Fill in `.env` (see reference table below). No secret is ever committed — `.env` is gitignored.

| Variable | Purpose | Required |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `LLM_PROVIDER` | `openai` \| `anthropic` \| `google` \| `local` | Yes |
| `LLM_API_KEY` | BYOK key for the chosen provider (omit if `LLM_PROVIDER=local`) | Conditional |
| `LOCAL_LLM_ENDPOINT` | Ollama/OpenAI-compatible endpoint URL | If `LLM_PROVIDER=local` |
| `SENTIMENT_MODEL_NAME` | HF model id, default `cardiffnlp/twitter-roberta-base-sentiment-latest` | Yes |
| `EMBEDDING_MODEL_NAME` | Sentence-Transformers model id, default `all-MiniLM-L6-v2` | Yes |
| `UPLOAD_MAX_MB` | Max upload file size | Yes |
| `UPLOAD_MAX_ROWS` | Max rows per dataset | Yes |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins | Yes |
| `JWT_SECRET` | Reserved for future auth (RULES.md §17 roadmap) | Placeholder OK for hackathon |

## 3. Start Infrastructure (Postgres + pgvector + Redis)
```bash
docker compose up -d postgres redis
```
`docker-compose.yml` initializes the `pgvector` extension via an init script — do not enable it manually unless the init script is missing.

## 4. Backend (Track A)
```bash
cd backend
uv sync                       # or: poetry install
uv run alembic upgrade head   # apply migrations
uv run uvicorn app.main:app --reload --port 8000
```
Interactive API docs: `http://localhost:8000/docs`

### Start the Celery worker (separate terminal)
```bash
cd backend
uv run celery -A app.jobs worker --loglevel=info
```

## 5. Frontend (Track B)
```bash
cd frontend
pnpm install
pnpm dev
```
Runs at `http://localhost:3000`, pointed at `http://localhost:8000` via `NEXT_PUBLIC_API_URL` in `.env`.

Until Track A's real endpoints are ready, set `NEXT_PUBLIC_USE_MOCKS=true` to serve fixtures from `/lib/mocks` matching API_CONTRACTS.md.

## 6. Demo Data (Track C)
```bash
cd data
python generate_demo_dataset.py --rows 5000 --domain college --out demo_feedback.csv
```
Upload `demo_feedback.csv` through the running app's upload flow, or seed it directly:
```bash
uv run python scripts/seed_dataset.py --file ../data/demo_feedback.csv
```

## 7. One-Command Full Stack (once all services are Dockerized)
```bash
docker compose up -d --build
```
Brings up `frontend`, `api`, `worker`, `postgres`, `redis` together — mirrors the target production shape (ARCHITECTURE.md §23) at local scale.

## 8. Running Tests
```bash
# backend
cd backend && uv run pytest

# frontend
cd frontend && pnpm test
```
Every merged PR must pass both suites (RULES.md §11).

## 9. Common Issues
| Symptom | Fix |
|---|---|
| `pgvector extension not found` | Re-run `docker compose down -v && docker compose up -d postgres` to re-trigger the init script |
| Transformer model download fails/slow | Pre-download once: `uv run python -c "from transformers import pipeline; pipeline('sentiment-analysis', model='$SENTIMENT_MODEL_NAME')"` |
| Celery worker not picking up jobs | Confirm `REDIS_URL` matches between `api` and `worker` processes |
| Frontend shows stale mock data after backend is live | Confirm `NEXT_PUBLIC_USE_MOCKS=false` and restart `pnpm dev` |

## 10. Where To Go Next
- Read TASK_SPLIT.md for your track's task list.
- Read API_CONTRACTS.md before writing any endpoint or any frontend data-fetching hook.
- Read RULES.md before writing ML or analytics code — it defines what's forbidden (fake metrics, unlabeled VADER-as-default, etc.).
