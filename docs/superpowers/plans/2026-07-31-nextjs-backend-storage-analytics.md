# Implementation plan: Storage ingest + SQL analytics

**Date:** 2026-07-31  
**Spec:** `docs/superpowers/specs/2026-07-31-nextjs-backend-storage-analytics-design.md`

## Tasks

### 1. Migration

File: `supabase/migrations/20260731140000_storage_ingest_analytics.sql`

- Alter `import_batch` status check + `storage_path` / `parsed_path`
- Composite indexes on `spend_line`
- INVOKER RPCs + grants
- Storage bucket `spend-uploads` + policies

### 2. Lib helpers

- `src/lib/spend/storage-paths.ts` — path builders + bucket name
- `src/lib/spend/import-pipeline.ts` — download/parse/commit helpers (pure where possible)
- `src/lib/spend/constants.ts` — add `SPEND_UPLOADS_BUCKET`, page size

### 3. Server actions

- Rewrite `src/api/import-spend.ts`
- Add `src/api/analytics.ts` with `fetchSpendLinesPage`
- Update tests

### 4. Wizard UI

- `upload-wizard.tsx` — create pending + Storage upload + prepareImport
- `confirm-import.tsx` — preview from server + commitImport (no client SheetJS)

### 5. Analytics UI

- `analytics/page.tsx` — batches + RPC series only
- `analytics-dashboard.tsx` — consume series; fetch pages for drill-down
- `detail-sheet.tsx` — support pagination controls when needed

### 6. Verify

`pnpm lint && pnpm typecheck && pnpm test`

Apply migration to linked Supabase before manual Vercel preview check.
