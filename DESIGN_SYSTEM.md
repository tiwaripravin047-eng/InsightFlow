# DESIGN_SYSTEM.md — Visual & Interaction Language

Single source of truth for Track B so every page looks like one product, not five different components stitched together (RULES.md §2, §13). Own design language — no cloning of Dovetail/Zonka/etc. visual design (PRD.md, TECH_STACK.md §9).

## 1. Design Principles
Premium, minimal, data-dense but readable, enterprise SaaS. No: generic Bootstrap admin look, excessive gradients, giant donut charts everywhere, decorative animation, word-cloud-as-primary-visualization, chart spam.

## 2. Typography
- One typeface family for the whole app (a variable sans-serif, e.g., Inter or similar system-adjacent font) — no mixing display fonts per page.
- Scale: `text-xs` (labels/meta) → `text-sm` (body/table) → `text-base` (default) → `text-lg`/`text-xl` (section headers) → `text-2xl`/`text-3xl` (page titles, KPI numbers).
- KPI numbers use a heavier weight (semibold/bold) to anchor the eye; body text stays regular weight.

## 3. Spacing
- 4px base unit (Tailwind default scale). Card padding: `p-4`–`p-6`. Section gaps: `gap-6`–`gap-8`. Never hand-roll a spacing value outside the Tailwind scale.

## 4. Color Semantics
Defined once in `tailwind.config` as design tokens, referenced everywhere — never redefined per component.

| Token | Use | Example |
|---|---|---|
| `sentiment-positive` | Positive sentiment, "improved" state | green family |
| `sentiment-negative` | Negative sentiment, "worsened" state | red family |
| `sentiment-neutral` | Neutral sentiment | gray/blue-gray |
| `severity-low` / `severity-medium` / `severity-high` / `severity-critical` | Severity badges, priority scores | yellow → orange → red gradient, critical gets an icon too (never color-only, RULES.md §13) |
| `status-open` / `status-in-progress` / `status-resolved` / `status-verified` | Action Center status | distinct hues, consistent across Kanban and detail views |
| `trend-rising` / `trend-declining` / `trend-stable` / `trend-emerging` | Trend arrows/badges | red-up / green-down / gray-flat / purple-new |

Color is never the only signal — every severity/sentiment/trend indicator pairs color with an icon and a text label.

## 5. Components (shadcn/ui base, themed)
- **KPI Card**: number (large, bold) + label (small, muted) + optional delta badge (colored per §4). No unnecessary icon unless it adds meaning.
- **Insight Card / Issue Row**: title, topic tag, severity badge, priority score, trend arrow, volume, "View evidence" affordance — consistent field order everywhere it appears (Overview, Issues, Themes).
- **Evidence Drawer**: opens on any "View evidence" click; shows representative samples, sentiment distribution, date range, confidence — same component reused across Insights, Issues, Themes, Ask AI citations (RULES.md §2).
- **Table (Feedback Explorer, Issues list)**: sticky header, sortable columns, row-level click opens detail drawer, pagination controls at bottom, never infinite-scroll without a visible count.
- **Filter Bar**: pill-style active filters, clear-all affordance, filter state synced to URL query params.
- **Status Badge**: pairs a color token with a text label, never color alone.
- **Empty State**: icon + one-sentence explanation + a suggested next action (e.g., "No critical issues this period" + "adjust date range").
- **Loading State**: skeleton matching the eventual layout, never a generic spinner covering the whole page for a partial-page fetch.
- **Error State**: plain-language message + retry action, never a raw stack trace or error code shown to the user.

## 6. Charts
- **KPI sparkline / sentiment-over-time**: Recharts, minimal gridlines, single accent color per series, legend only when >1 series.
- **Issue Trend Matrix**: ECharts bubble chart — x = frequency, y = negative sentiment/severity, bubble size = impact; quadrant labels (not just axis labels) so a non-technical viewer immediately reads "high-frequency high-severity" without decoding axes.
- No 3D charts, no unnecessary chart-junk (drop shadows, excessive gridlines, decorative gradients on bars).
- Every chart has an accessible data-table fallback (RULES.md §13).

## 7. Iconography
One icon set app-wide (e.g., lucide-react, consistent with shadcn/ui). Icons always paired with a text label in this product — no icon-only buttons for primary actions.

## 8. Responsive Rules
- Dashboard is desktop-first (primary use case: analyst/manager at a desk) but must degrade gracefully to tablet width — KPI cards wrap to 2-column, tables become horizontally scrollable with sticky first column.
- Mobile is a "view, not author" experience — Ask AI and Overview should work; Feedback Explorer/Action Center editing can be deprioritized for mobile if time-constrained (note this as a known limitation, not a silent gap).

## 9. Interaction Patterns
- Every number/insight is clickable to its evidence — this is a interaction law, not a nice-to-have (RULES.md §8).
- Filters apply instantly (no "Apply" button) but are debounced for search inputs.
- Destructive/status-changing actions (e.g., marking an action "Resolved") get a lightweight confirm, not a full modal interruption.

## 10. Accessibility Checklist (per component, before merge)
- [ ] Keyboard-navigable (tab order logical, focus states visible)
- [ ] 4.5:1 contrast minimum
- [ ] No color-only signal
- [ ] Screen-reader label on icon-only elements (even though we avoid icon-only buttons, icons inside badges still need `aria-label`)
- [ ] Loading/error/empty state implemented
