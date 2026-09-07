# RULES.md — Engineering Constitution for Feedback Intelligence OS

Binding for all implementation work. Enforces the decisions in PRD.md, TECH_STACK.md, and ARCHITECTURE.md. Where a conflict appears, ARCHITECTURE.md's layering wins and the Forbidden Practices list (§30) is non-negotiable.

## 1. Architecture
- Follow the layering in ARCHITECTURE.md §5–7 exactly: presentation → API → application services → ML/analytics → data access. No layer skips another.
- No router or ML module talks to the database directly — only through repositories.
- New top-level folders/services require updating ARCHITECTURE.md in the same change.

## 2. Frontend
- TypeScript strict mode on for the entire app; no `any` without an inline justification comment.
- No component exceeds ~200 lines; split into subcomponents when it does.
- Components receive data via props/loaders; they do not fetch data themselves except at the page/route level.
- Chart components are pure/presentational — no business logic (severity thresholds, priority math) lives in a chart component.
- Single design-token source (Tailwind config) for color, spacing, typography — no ad hoc inline styles duplicating token values.

## 3. Backend
- Python type hints required on all function signatures in `app/services`, `app/ml`, `app/analytics`; `mypy` in CI.
- All API request/response bodies are Pydantic models — no raw `dict` returns from routers.
- No bare `except:`; catch specific exceptions and log with context.

## 4. ML
- All models accessed through the interfaces in `app/ml` — no direct model calls from services or routers.
- Inference is batched, never called per-single-row in a loop over an entire dataset.
- Every inference result includes a confidence score; never fabricated or defaulted to a fixed number when the model doesn't provide one — mark `null` and reflect that in the UI.
- Sentiment classification's **primary/default** path must be a transformer model. VADER or any lexicon-based method may exist only as an explicitly-labeled optional fallback (per TECH_STACK.md §3) — it must never be the unlabeled default result presented as "AI analysis."
- Every stored classification/insight record includes model name + version + pipeline version (ARCHITECTURE.md §9).

## 5. Data
- Uploaded datasets validated before processing (schema, encoding, row count) per PRD.md §26.
- Column mapping stored per dataset, never assumed/hardcoded to a specific domain (e.g., never hardcode "college" field names).
- All schema changes via Alembic migrations — no manual schema edits.
- Foreign keys enforced at the DB level for every relationship in the ER diagram.

## 6. Analytics Correctness
- Every number shown in the UI must originate from a computed value in the database or a direct aggregation query — never typed as a literal in frontend code, never invented by an LLM prompt.
- Percentages, counts, and trend values are computed server-side and returned as data; the frontend only formats/displays them.
- No magic numbers in scoring/threshold logic — priority score weights and severity thresholds live in `analytics_config.yaml`, never inline in code.
- Trend and "What Changed?" percentages are computed from actual time-windowed queries, never estimated or visually interpolated without a real data point.
- Emerging Issue flags must pass the minimum-sample-size and smoothing gates in ARCHITECTURE.md §9 before being surfaced — no single-day spike is ever labeled "emerging" without passing the gate.

## 7. AI / LLM
- LLM calls used only for: executive summary phrasing, action recommendation phrasing, topic naming, and NL-query answer composition.
- Every such LLM prompt must receive the actual computed data as grounding context and must not be asked to produce or estimate numbers on its own.
- NL query answers are generated only from data returned by a real filtered/aggregation query; if a question can't be mapped to available data/filters, the system says it cannot answer rather than guessing.
- Root-cause/driver output must always use "likely driver" / "associated" / "correlated signal" language — never "caused by" or equivalent causal assertion, regardless of how confident the correlation score is.

## 8. Evidence & Traceability
- Every `insight` record must reference at least one `feedback` record via `insight_evidence`; an insight with zero evidence links must not be created.
- Every dashboard chart/KPI element supports a "drill into evidence" action resolving to the real filtered feedback set behind that number.
- Confidence values must reflect actual methodology (sample size, model confidence, topic coherence, duplicate ratio) — never a fabricated precision figure (e.g., no "92.7%" unless genuinely computed to that precision).

## 9. Security
- All file uploads validated for type and size before being written to storage or queued for processing.
- No arbitrary code execution paths from uploaded file content.
- CORS restricted to known frontend origins; no wildcard `*` in production config.
- Secrets via environment variables/secret manager only — never committed, never in frontend bundle.
- Maintain a zero-telemetry default posture: no outbound network calls beyond operator-configured LLM/model endpoints.

## 10. Privacy
- No unnecessary retention of personally identifying information beyond what's present in uploaded feedback text.
- Raw feedback text excluded from application logs (DEBUG-only, disabled in production).
- Export features respect the same filter/access boundaries as the dashboard — no unfiltered full-dataset dump without an explicit user action.

## 11. Testing
- Every pipeline stage (`cleaning`, `sentiment`, `topic`, `aspect`, `emotion/intent`, `severity`, `trend`, `emerging`, `duplicate detection`) has unit tests with known input/output fixtures.
- Priority score formula has explicit unit tests covering edge cases (zero volume, 100% negative, no growth data).
- API contract tests validate response schemas match documented Pydantic models.

## 12. Performance
- No N+1 query patterns in list endpoints — use joins/prefetch in the repository layer.
- Dashboard aggregate endpoints must be servable from Redis cache when available; cache-miss path must still return within acceptable latency at target dataset scale.
- No expensive ML inference triggered on dashboard render — only on ingestion/recompute jobs.

## 13. UX / Accessibility
- All charts have a non-color-dependent way to distinguish categories (icon/label in addition to color).
- All interactive elements (filters, table rows, buttons) are keyboard-navigable with accessible labels.
- Minimum 4.5:1 contrast ratio for text against background.
- Severity/sentiment color mapping defined once and reused everywhere — no chart using a different red for "negative" than another chart.
- Every panel implements loading, error, and empty states — no infinite/fake loading spinners, no panel that silently shows nothing.

## 14. Git Conventions
- Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`).
- No direct commits to `main`; feature branches + review (self-review against this checklist for a small team).

## 15. Dependencies
- New dependencies require a one-line justification tied to a PRD/architecture requirement in the PR description.
- No dependency added purely to make the tech stack look more sophisticated.

## 16. Documentation
- Any new API endpoint documented via FastAPI OpenAPI annotations (summary, description, response model).
- Any change to the ML pipeline, schema, or scoring formula requires updating ARCHITECTURE.md in the same change.
- The four canonical docs (PRD.md, TECH_STACK.md, ARCHITECTURE.md, RULES.md) are the single source of truth — never fork them into `_v2`/`_new`/`_final` variants; update in place.

## 17. IP / Attribution
- No proprietary code, UI, assets, branding, or copy from Dovetail, Ipiphany, Thematic, Zonka, or Sprinklr may be copied — product *patterns* only, reimplemented independently.
- Any open-source code or pattern adapted from Rereflect (or any other repo) must be logged in TECH_STACK.md §9 with repository, license, what was reused, and why.
- Respect the MIT license terms of Rereflect where any code (not just architecture pattern) is directly adapted.

## 18. Production Readiness
- No placeholder/mock data rendered in a non-demo/production build — insufficient data shows an honest empty/low-confidence state, never a fabricated chart value.
- All loading states must resolve to success, error, or empty — never hang indefinitely.

## 19. Definition of Done
A feature is "done" only when:
1. It maps to a stated PRD requirement.
2. It has passing unit/integration tests.
3. All numbers/insights it displays are traceable to real computed data.
4. It has loading, error, and empty states implemented.
5. It meets the accessibility and UI consistency rules above.
6. Relevant docs (ARCHITECTURE.md, API docs) are updated in place.

## 20. Explicit Forbidden Practices — NEVER:
- Hardcode analytics values or chart data in frontend or backend code.
- Fabricate model results, confidence scores, or evaluation benchmarks.
- Let an LLM invent, estimate, or "round" a metric that should come from computed data.
- Use keyword/lexicon matching (or VADER/TextBlob) as the unlabeled default/primary sentiment engine.
- Present a correlational driver as a causal claim.
- Create an insight with no linked evidence.
- Expose API keys or secrets in frontend code or client-visible network requests.
- Silently swallow errors or exceptions anywhere in the pipeline.
- Duplicate business logic across services instead of sharing it.
- Create loading states that never resolve to success/error/empty.
- Ship placeholder/mock data in a production build.
- Add dependencies not tied to a stated requirement.
- Build giant React components or backend "god classes" that mix concerns.
- Put database access or business logic inside UI components.
- Copy proprietary UI, code, or assets from any referenced closed-source competitor product.
- Fork the four canonical docs into duplicate/versioned filenames instead of updating them in place.
- Claim statistical certainty (e.g., "confirmed trend") when sample size or coherence is insufficient — always reflect actual confidence.
