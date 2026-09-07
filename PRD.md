# PRD.md — Feedback Intelligence OS
*(Built on the Rereflect foundation, for SIH Problem Statement 1: AI-Powered Feedback Intelligence Dashboard)*

> Rereflect (`github.com/haqaliz/rereflect`) is our engineering foundation, not our product spec. Dovetail, Ipiphany, Thematic, Zonka and Sprinklr are used only as product-pattern references (see §29 Competitive Matrix). No proprietary code, UI, or assets from any of them are copied.

## 1. Product Vision
Convert large volumes of unstructured feedback into **explainable issues, trends, priorities, evidence and recommended actions** — not just a sentiment percentage. Core loop: **RAW FEEDBACK → UNDERSTAND → CLUSTER → EXPLAIN → PRIORITIZE → ACT → MEASURE.**

Pitch: *"Don't just tell me what people said. Tell me what changed, why it matters, show me the evidence, and tell me what deserves attention first."*

## 2. Problem
Colleges, hospitals, retailers and startups collect reviews, tickets, and survey responses at a volume no team can read manually. Sentiment gets lost, recurring problems go unnoticed until they're large, and decisions get made on anecdotes instead of evidence.

## 3. PS1 Requirement Mapping
| PS1 Requirement | How FIOS Satisfies It |
|---|---|
| Sentiment classification (Pos/Neg/Neutral) | Transformer sentiment classifier, §11 |
| Recurring words/topics/tags | Semantic topic + sub-topic discovery, §11 |
| Interactive visualization | Dashboard (Overview, Issues, Themes, Trends, Feedback, Actions, Ask AI), §13 |
| Filtering by category/time/sentiment | Global filter bar + per-page filters, §14 |
| Non-technical usability | Executive Summary, Issue Radar, Action Center — no chart-reading required |
| Large-volume understanding | Async batch pipeline, clustering, duplicate detection, §11 |
| Data-backed decisions | Evidence layer (§19) — every claim traces to real feedback and computed numbers |

## 4. Target Users
Operations/quality leads (colleges, hospitals, retail chains), CX managers, startup founders/PMs, support leads, hackathon judges.

## 5. Personas
| Persona | Role | Need |
|---|---|---|
| Priya | College Dean of Student Affairs | Which hostel/cafeteria issues are worsening this month, with proof |
| Arjun | Retail CX Manager | Triage thousands of reviews weekly; prioritize what to escalate |
| Dr. Mehta | Hospital Quality Officer | Aspect-level sentiment (staff vs. wait time vs. billing) to target training |
| Sana | Startup Founder | Plain-English weekly digest with zero analyst on staff |

## 6. Jobs-to-be-Done
1. When I have thousands of feedback entries, tell me the 5 issues that matter most right now.
2. When a metric looks bad, show me evidence, not a black box.
3. When I compare two periods, tell me what changed and why.
4. When I ask a plain-English question, give a data-backed answer, never a guess.
5. When I act on an issue, let me track whether the outcome actually improved.

## 7. Product Goals
- Convert raw feedback into structured, evidence-linked insights within minutes.
- Surface severity, trend, likely drivers, and recommended action — not just sentiment counts.
- Usable by a non-technical decision-maker with zero training.
- Domain-agnostic via configurable schema (college, hospital, retail, startup, support, product review, employee survey).
- Fully explainable: every AI claim traceable to underlying feedback and computed statistics; every confidence value backed by real methodology.

## 8. Non-Goals
- Not a real-time streaming ingestion platform for this phase (batch CSV upload; extension points left for Excel/JSON/API/webhooks/DB).
- Not a customer-facing auto-reply/ticketing tool.
- Not a general-purpose BI tool.
- Not training custom sentiment/topic models from scratch for the hackathon — uses pretrained, swappable, versioned models.
- No claim of causal inference — "likely driver" / "correlated signal" language only (§18).
- Multi-tenant RBAC and full CRM/issue-tracker integrations (Rereflect has these) are **out of scope for the hackathon rebuild**; schema reserves the extension points (see ARCHITECTURE.md §17).

## 9. Core User Journeys
1. **Upload → Insight**: Upload CSV → map columns → async processing with progress → dashboard opens with Executive Summary pre-generated.
2. **Investigate an Issue**: Issue Radar → click issue → evidence, trend, likely drivers, representative feedback, recommended actions, owner, status.
3. **Compare Periods**: "What Changed?" — this week vs last week / custom range → improved / worsened / emerging / stable, all computed.
4. **Ask a Question**: "Ask Feedback" NL query → translated into real filters/aggregates → grounded answer with cited evidence.
5. **Act & Measure**: Create an action from an issue → track status (Open/In Progress/Resolved/Verified) → before/after outcome metric.

## 10. Feature Requirements
**MUST HAVE**
- Sentiment classification (transformer-based, 3-class, confidence, model version)
- Semantic topic/sub-topic discovery (not word-frequency only)
- Priority/severity scoring, explainable and configurable
- Trend detection (rising/declining/stable)
- Filtering: category, date range, sentiment, topic, source
- CSV upload with column mapping, validation, preview
- Evidence drill-down from every insight/KPI/chart element
- Feedback Explorer with search
- AI Executive Summary (LLM-composed, fully data-grounded)

**SHOULD HAVE**
- Aspect-based sentiment
- Emotion/intent/urgency classification
- Duplicate/near-duplicate clustering
- Emerging Issue Detection with minimum-sample statistical safeguards
- "What Changed?" period comparison
- Action Center with status tracking
- Root-cause/likely-driver surfacing (correlational, never causal, language-gated)
- Natural-language "Ask Feedback" query, grounded, non-hallucinating

**NICE TO HAVE**
- Multilingual (Indian language) support via model swap (IndicBERT/XLM-R)
- Role-based dashboard views (Executive/Operations/Product/Support/Analyst) via configurable filters, not separate apps
- Closed-loop outcome tracking (before/after metric on resolved actions)

## 11. AI Capabilities
- **Sentiment**: Transformer classifier (RoBERTa-class default), 3-class + confidence + model version. Replaces VADER as primary engine (see TECH_STACK.md §3 for Rereflect audit — VADER remains available only as an optional zero-cost fallback tier, never the default classification path presented as "AI analysis").
- **Topic/Sub-topic**: Sentence-embedding clustering (HDBSCAN) with a topic-labeling layer (KeyBERT/TF-IDF + LLM naming), supporting hierarchy (e.g., Food → Quality, Temperature, Price, Hygiene).
- **Aspect Sentiment**: Per-aspect sentiment within a single feedback item (e.g., "campus" positive, "Wi-Fi" negative in the same sentence).
- **Emotion/Intent/Urgency**: Secondary classifier layer (complaint/praise/suggestion/question; anger/frustration/appreciation/etc.), degradable without breaking the core pipeline.
- **Severity/Priority Score**: deterministic, explainable, configurable formula (ARCHITECTURE.md §8).
- **Trend Detection**: rolling time-window comparison of volume and sentiment per topic.
- **Emerging Issue Detection**: relative-growth flag with minimum sample size and statistical smoothing to avoid flagging noise/single spikes.
- **Duplicate/Near-duplicate Clustering**: embedding cosine similarity, distinguishes raw mention count from unique issue count.
- **Root-Cause/Driver Analysis**: correlation-based "likely driver" surfacing between a satisfaction/sentiment shift and topic-level negative mention growth — always labeled as association, never asserted causation.
- **LLM Layer**: strictly for summarization, topic naming, action-recommendation phrasing, and NL-query answer composition. Never invents a metric — every number an LLM outputs must be interpolated from data actually returned by the analytics layer.

## 12. Insight Engine
Structured insight objects (schema in ARCHITECTURE.md §9) are the platform's core output unit: title, topic, sentiment, severity, priority_score + factor breakdown, trend, change_percent, volume, unique_issue_count, evidence (feedback IDs), affected_categories, likely_drivers, recommended_actions, confidence, model_versions. Ranked by priority score to power the Issue Radar.

## 13. Dashboard Requirements — Information Architecture
Global navigation: **Overview · Issues · Themes · Trends · Feedback · Actions · Ask AI · Settings**

- **Overview**: header (dataset selector, date range, filters, search, export) → KPI cards (Total Feedback, Positive/Negative/Neutral %, Critical Issues, Emerging Issues) → AI Executive Summary → Issue Radar → Sentiment Trend → Top Themes → Emerging Issues → Recent Critical Feedback.
- **Issues**: dedicated management view — Title, Description, Volume, Trend, Sentiment, Severity, Priority, Affected segments, Evidence, Likely drivers, Suggested actions, Owner, Status, Outcome.
- **Themes**: hierarchical Theme → Sub-theme → Feedback, with volume, sentiment, trend, top examples, segments, related issues.
- **Trends**: sentiment-over-time, issue trend matrix (frequency × severity, bubble = impact).
- **Feedback (Explorer)**: searchable/filterable table — Feedback, Sentiment, Theme, Aspect, Intent, Emotion, Urgency, Severity, Date, Category, Source, Confidence. Row click → detail drawer.
- **Actions (Action Center)**: Action, Issue, Reason, Evidence, Suggested owner, Priority, Status (Open/In Progress/Resolved/Verified), Created, Outcome metric.
- **Ask AI**: conversational analytics — computed metrics, charts, cited evidence, filters, related issues; never hallucinated.
- Empty, loading, and error states defined for every panel (RULES.md §29).

## 14. Filtering
Composable filters: category, date range, sentiment, topic/sub-topic, aspect, source, severity, confidence threshold, segment. Filter state reflected in URL for shareability.

## 15. Feedback Explorer
See §13. Detail drawer shows: original text, language, sentiment + confidence, themes/sub-themes, aspects, emotion, intent, urgency, severity, similar/duplicate feedback, related issue, evidence context.

## 16. Issue Radar
Auto-ranked top-N issues by priority score (frequency × negative-sentiment-ratio × severity × recent growth × recurrence × urgency, see ARCHITECTURE.md §8). Makes "what should I care about first?" immediately visible without manual chart reading.

## 17. Emerging Issues
Flags issues with small absolute volume but high relative negative-mention growth in a rolling window, distinguishing: high-volume established issue, low-volume emerging issue, temporary spike, persistent issue, resolved/improving issue. Minimum sample size and smoothing thresholds prevent flagging every small fluctuation.

## 18. Root-Cause / Driver Analysis
Never claims causation. Uses "likely driver," "associated issue," "correlated signal" language only. Example: overall satisfaction down 18% → potential drivers: Wi-Fi reliability, cafeteria quality, support response time — each backed by its own evidence set and correlation strength, not asserted as "caused by."

## 19. Evidence Layer (Non-Negotiable)
Every major insight must expose: supporting feedback count, date range, sentiment distribution, topic, affected segments, representative feedback samples, source, confidence, filters used, and analysis/model version. Every insight is clickable: **Insight → Evidence → Raw Feedback**. No unsupported AI claim is permitted anywhere in the product.

## 20. "What Changed?"
Structured period comparison (this week vs last week, this month vs last month, custom range) producing: Improved / Worsened / Emerging / Stable findings, each with a real computed percentage and evidence link — never a narrative-only claim.

## 21. Action Center
Converts insights into recommended actions (issue, evidence, suggested owner, priority, status, success metric). Actions are explicitly labeled "AI-suggested — review before acting," never presented as authoritative decisions. Supports Open → In Progress → Resolved → Verified with before/after outcome measurement where data allows.

## 22. Feedback Clustering
Groups semantically similar feedback (e.g., "food was cold," "meals weren't served hot," "food temperature is terrible" → one FOOD TEMPERATURE cluster). Dashboard shows raw mention count vs. unique semantic cluster count vs. negative ratio per cluster — this distinguishes 1,000 comments from 1,000 comments about the same issue.

## 23. Natural Language Query ("Ask Feedback")
Translates questions ("Why are students unhappy this month?", "What got worse this week?", "Show negative feedback about Wi-Fi") into real filter/aggregation operations against the analytics layer. LLM composes the answer text from returned data only; if a question can't be mapped to available data/filters, the system says so instead of guessing.

## 24. Confidence / Data Quality
Every insight carries a reliability context built from model confidence, sample size, topic coherence, evidence volume, duplicate ratio, and data completeness. Precision is never faked (e.g., never shows "92.7% confidence" unless the underlying methodology genuinely supports that precision) — low-confidence insights are visually flagged as such, not hidden.

## 25. Domain Flexibility
Configurable schema, not hardcoded to college feedback. Core columns: id, text, timestamp, category, source, rating, department, location, language, metadata. Optional columns degrade gracefully when absent.

## 26. Data Ingestion
CSV (MVP), with clear extension points for Excel/JSON/API/webhooks/DB/survey platforms (not built now, per Non-Goals). Flow: Upload → Column Detection → Preview → Column Mapping → Validation → Processing → Analysis → Dashboard. Validation detects: empty feedback, duplicate rows, invalid dates, missing columns, unsupported file types, malformed records, oversized files.

## 27. Security / Accessibility / Performance
See ARCHITECTURE.md §18–22 and RULES.md for the binding rules. Summary: env-based secrets, upload validation, CORS restriction, PII-aware logging (no raw text in logs above DEBUG); WCAG 2.1 AA target; async batch pipeline scaling from 100 to 100,000+ rows without architecture change.

## 28. Success Metrics
- Time from upload to first actionable insight (< 5 min for 10K rows in demo environment).
- % of insights traceable to evidence within 2 clicks (target: 100%).
- Reduction in manual feedback-reading time (qualitative).
- Sentiment classification accuracy on validation set, honestly reported (never fabricated) — see ARCHITECTURE.md model evaluation notes.

## 29. Competitive Differentiation — Matrix
`YES` = implemented, `PARTIAL` = partial/basic, `NO` = not implemented, `UNKNOWN` = not verifiable from public info.

| Capability | Dovetail | Ipiphany | Thematic | Zonka | Sprinklr | Rereflect (base) | **Our Product (target)** |
|---|---|---|---|---|---|---|---|
| Feedback ingestion (multi-source) | YES | UNKNOWN | YES | YES | YES | YES (CSV, email, Slack, Intercom, Zendesk, webhooks) | PARTIAL (CSV now; extension points for rest) |
| Sentiment (transformer-based) | YES | UNKNOWN | YES | YES | YES | PARTIAL (VADER default; optional local transformer, opt-in) | YES (transformer default) |
| Themes / sub-themes | YES | UNKNOWN | YES | YES | YES | PARTIAL (BERTopic-based pain points/feature requests, not full hierarchy) | YES |
| Aspect-level sentiment | PARTIAL | UNKNOWN | PARTIAL | YES | YES | NO | YES |
| Emotion / Intent / Urgency | UNKNOWN | UNKNOWN | UNKNOWN | YES | YES | PARTIAL (urgency flag only) | YES (SHOULD) |
| Root-cause / likely drivers | UNKNOWN | YES | PARTIAL | UNKNOWN | UNKNOWN | NO | YES (correlational, labeled) |
| Trend detection | YES | YES | YES | YES | YES | YES (7/30/90-day trend arrows) | YES |
| Emerging issue detection | PARTIAL | YES | UNKNOWN | YES | UNKNOWN | PARTIAL (↑/↓/→ arrows, no formal threshold model) | YES (statistically gated) |
| Evidence traceability | YES | YES | YES | PARTIAL | PARTIAL | PARTIAL (drill to feedback list, not structured evidence object) | YES (first-class evidence layer) |
| Priority scoring | UNKNOWN | YES | UNKNOWN | PARTIAL | UNKNOWN | NO (churn risk score exists, not general issue priority) | YES (explainable, configurable) |
| Action Center / workflow | UNKNOWN | YES | PARTIAL | YES | YES | YES (Kanban, auto-assignment) | YES (issue-linked, outcome-tracked) |
| Natural-language query | YES | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | YES (AI Copilot, Cmd+K) | YES (grounded, non-hallucinating) |
| Role-based views | UNKNOWN | UNKNOWN | UNKNOWN | YES | YES | YES (Owner/Admin/Member RBAC) | PARTIAL (configurable views, not full RBAC in hackathon scope) |
| Outcome tracking | UNKNOWN | UNKNOWN | UNKNOWN | PARTIAL | UNKNOWN | PARTIAL (churn playbooks) | PARTIAL (before/after on resolved actions) |
| Self-hosting | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | YES (Docker Compose, MIT license) | YES |
| Open source | NO | NO | NO | NO | NO | YES (MIT) | YES |
| PS1 fit (India hackathon, domain-agnostic feedback) | LOW (enterprise UX research tool) | LOW (SaaS-focused) | LOW (enterprise VoC) | MEDIUM | LOW (enterprise) | MEDIUM (customer-feedback/churn framed, not domain-agnostic) | **HIGH (purpose-built)** |

## 30. Hackathon Demo Flow
1. Upload ~5,000-row feedback dataset.
2. Show column mapping + validation report.
3. Async processing with visible progress.
4. Dashboard opens: "3 issues need attention" (Executive Summary).
5. Issue Radar: Wi-Fi reliability / Cafeteria quality / Support response time.
6. Click Wi-Fi → 74% negative, +31% recent increase, 214 mentions, 5 affected locations.
7. Show evidence (representative feedback, drill-down).
8. Show likely drivers.
9. Show recommended action (Action Center).
10. Show a before/after comparison on a resolved action.

## 31. Future Roadmap
- Additional ingestion sources (Excel, JSON, API/webhooks, survey platforms) — Rereflect already proves several of these are feasible on this stack.
- Domain-fine-tuned sentiment model using organisation-specific labeled data.
- Multilingual expansion (IndicBERT/XLM-R).
- Full multi-tenant RBAC and CRM/issue-tracker integrations (informed by Rereflect's existing implementation).
- Automated alerting when an issue crosses a severity/trend threshold.
- Full closed-loop resolved-issue outcome tracking with statistical before/after significance.
