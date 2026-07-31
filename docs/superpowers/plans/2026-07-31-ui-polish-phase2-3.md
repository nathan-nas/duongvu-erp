# UI polish Phase 2–3 — Implementation Plan

**Goal:** Sonner, NumberFlow KPIs, Virtuoso for large detail tables, rare empty-state delight.

### Task 1: Sonner
- [x] `pnpm dlx shadcn@latest add sonner --yes`
- [x] Mount themed Toaster in root layout (dark class sync, no next-themes)
- [x] Wire upload-wizard + confirm-import; fix analytics redirect to `/app/analytics`

### Task 2: NumberFlow
- [x] `pnpm add @number-flow/react`
- [x] KPI values use NumberFlow (currency + counts)

### Task 3: Virtuoso
- [x] `pnpm add react-virtuoso`
- [x] Detail sheet: TableVirtuoso when rows ≥ 40

### Task 4: Empty delight
- [x] Soft motion + Lucide on analytics empty / upload idle

### Task 5: Verify
- [x] `pnpm lint && pnpm typecheck && pnpm test`
