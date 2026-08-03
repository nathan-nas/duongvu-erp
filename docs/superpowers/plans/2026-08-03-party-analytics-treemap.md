# Chi theo đối tác — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add “Chi theo đối tác” treemap on Phân tích with click → paged spend lines + total for the selected composite party label.

**Architecture:** Mirror plant/expense: SQL `spend_agg_by_party` + `spend_lines_page` kind `party`, wire through `fetchSpendAggregates` into `AnalyticsDashboard`.

**Tech Stack:** Next.js App Router, Supabase SQL RPCs, Recharts treemap, Vitest, Vietnamese UI.

## Global Constraints

- UI copy: Vietnamese only
- No unbounded `spend_line` loads — use paged RPC + **Tải thêm**
- Label: `code — name` with em dash; skip both-blank
- No new KPI, no master supplier table
- Deploy: Vercel only; RLS via `SECURITY INVOKER`

---

## File structure

```text
docs/superpowers/specs/2026-08-03-party-analytics-treemap-design.md
docs/superpowers/plans/2026-08-03-party-analytics-treemap.md
supabase/migrations/20260803100000_spend_agg_by_party.sql
src/lib/spend/format.ts          (+ formatPartyLabel)
src/lib/spend/format.test.ts
src/api/analytics.ts
src/app/app/analytics/page.tsx
src/components/spend/analytics-dashboard.tsx
```

---

### Task 1: Party label helper + tests

**Files:** `src/lib/spend/format.ts`, `src/lib/spend/format.test.ts`

- [ ] Add `formatPartyLabel(code, name): string | null`
- [ ] Tests for both sides, one missing, both blank → null

### Task 2: Migration

**Files:** `supabase/migrations/20260803100000_spend_agg_by_party.sql`

- [ ] `spend_agg_by_party(p_from, p_to, p_top)`
- [ ] Replace `spend_lines_page` with added `party` branch
- [ ] Revoke/grant execute for authenticated
- [ ] Apply to remote via Supabase MCP / CLI

### Task 3: API + page

**Files:** `src/api/analytics.ts`, `src/app/app/analytics/page.tsx`

- [ ] `SpendFilterKind` += `"party"`
- [ ] Fetch top-15 party aggregates
- [ ] Pass `partyData` into dashboard

### Task 4: Dashboard UI

**Files:** `src/components/spend/analytics-dashboard.tsx`

- [x] Full-width “Chi theo đối tác” card + expand/drill
- [x] Party click → Hàng hóa summary + lines; item click filters lines

### Task 5: Verify

- [ ] `pnpm lint && pnpm typecheck && pnpm test`
