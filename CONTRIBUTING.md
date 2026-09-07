# Contributing to InsightFlow

Welcome to the team! This repository coordinates work across 3 developers / PCs for the Smart India Hackathon (Problem Statement 1).

---

## 1. Track Ownership & Separation of Concerns

| Track | Primary Owner | Directory Scope | Responsibilities |
|---|---|---|---|
| **Track A** | PC 1 | `backend/app/{api,services,ml,analytics,db,jobs,core,schemas}`, `backend/tests/` | Backend API Gateway, ML Pipeline, Analytics Engine, Database |
| **Track B** | PC 2 | `frontend/` | Next.js Dashboard, ECharts visualizations, Evidence drilldown UI |
| **Track C** | PC 3 | `infra/`, LLM Layer | Infrastructure (Docker, K8s), Data loading, LLM RAG / Query synthesis |

### Shared Governance Files (Require coordination before editing)
- `PRD.md`
- `TECH_STACK.md`
- `ARCHITECTURE.md`
- `RULES.md`
- `TASK_SPLIT.md`
- `API_CONTRACTS.md`
- `analytics_config.yaml`

> **Note**: `API_CONTRACTS.md` is frozen. Any required field changes must be backward-compatible, agreed upon, and documented before modifying schemas.

---

## 2. Getting Started (For New Teammates on PC 2 and PC 3)

Follow these exact steps from top to bottom:

```bash
# 1. Clone the shared repository
git clone https://github.com/tiwaripravin047-eng/InsightFlow.git
cd InsightFlow

# 2. Inspect branches
git branch -a

# 3. Ensure you are on latest main
git checkout main
git pull origin main

# 4. Create your track branch
# If you are on Track B (Frontend):
git checkout -b feature/track-b

# If you are on Track C (Infra + LLM):
git checkout -b feature/track-c
```

---

## 3. Daily Development & PR Workflow

**Rule:** Never commit directly to `main`. `main` is the integration branch.

```bash
# 1. Before starting work, keep in sync with main:
git checkout feature/track-x
git pull --rebase origin main

# 2. Make your track changes in your owned directory...

# 3. Stage and commit using conventional commit format:
git add .
git commit -m "feat(frontend): implement issue radar chart"

# 4. Push your branch to GitHub:
git push -u origin feature/track-x

# 5. Open a Pull Request (PR) on GitHub:
# feature/track-x -> main
# Request review from teammate, ensure CI/tests pass, then merge into main!
```

---

## 4. Commit Message Convention

Format: `<type>(<scope>): <description>`

- `feat:` new user-facing or system feature
- `fix:` bug fix
- `refactor:` code restructuring without changing functionality
- `test:` adding or fixing automated tests
- `docs:` documentation updates
- `chore:` maintenance, build tools, dependencies

**Examples:**
- `feat(ml): add aspect-based sentiment extraction`
- `feat(frontend): add feedback explorer drawer`
- `fix(analytics): correct priority score weight bounds`
- `test(contract): verify insights response envelope`
- `docs: update setup and contributing guides`

---

## 5. Secret Hygiene

- **Never** commit `.env` or `.env.local` files, API keys, passwords, or cloud credentials.
- All secrets are excluded in `.gitignore`.
- Use `.env.example` to document required variable names.
