# Resizable Table Columns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shared `DataTable` with resize/reorder/visibility prefs synced per user in Supabase; migrate spend lines, spend groups, and import batches tables.

**Architecture:** Pure merge helpers + Server Actions on `user_table_pref` + client `DataTable` that owns column UX; feature tables become thin column defs + row renderers.

**Tech Stack:** Next.js Server Actions, Supabase RLS, React client components, react-virtuoso, Vitest.

## Global Constraints

- UI text Vietnamese; brand tokens unchanged.
- No service-role in client / `NEXT_PUBLIC_*`.
- Only `auth.users` + existing spend tables + new `user_table_pref` (no org schema).
- Surgical diffs; tests for pure merge + API.
- CI: `pnpm lint && pnpm typecheck && pnpm test`.

---

## File map

| File | Responsibility |
|------|----------------|
| `supabase/migrations/20260813120000_user_table_pref.sql` | Table + RLS + grants |
| `src/lib/table-prefs/types.ts` | Pref + column id types |
| `src/lib/table-prefs/merge-column-prefs.ts` | Merge/clamp pure logic |
| `src/lib/table-prefs/merge-column-prefs.test.ts` | Unit tests |
| `src/api/table-prefs.ts` | get / upsert actions |
| `src/api/table-prefs.test.ts` | Auth + upsert tests |
| `src/components/ui/data-table.tsx` | Shared table primitive |
| `src/components/spend/detail-sheet.tsx` | Use DataTable |
| `src/components/data/batch-list.tsx` | Use DataTable |

---

### Task 1: Migration + merge helpers (TDD)

- [ ] Write failing tests for `mergeColumnPrefs`
- [ ] Implement `mergeColumnPrefs` + types
- [ ] Add SQL migration `user_table_pref`
- [ ] Apply migration to remote (Supabase MCP) when available

**Verify:** `pnpm test` passes for merge tests.

### Task 2: Server Actions

- [ ] `getTableColumnPrefs(tableId)` / `upsertTableColumnPrefs(tableId, prefs)`
- [ ] Unit tests with mocked supabase client

**Verify:** API tests pass.

### Task 3: `DataTable` component

- [ ] Column defs API, colgroup widths, resize handle, header drag-reorder
- [ ] Visibility picker (Vietnamese)
- [ ] Virtuoso path + non-virtual path
- [ ] Prefs hook: load on mount, debounce save

**Verify:** typecheck clean for new module.

### Task 4: Migrate consumers

- [ ] `detail-sheet` lines + groups → DataTable (`spend_lines`, `spend_groups`)
- [ ] `batch-list` → DataTable (`import_batches`)
- [ ] Keep sort, CRUD actions, group click selection

**Verify:** `pnpm lint && pnpm typecheck && pnpm test`.

### Task 5: Emil design-eng review

- [ ] Review resize/reorder/picker interactions; apply only high-value polish fixes
