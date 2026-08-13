# src/api

Server-side API for the authenticated app (Next.js Server Actions).

## Files

| File | Purpose |
|------|---------|
| `import-spend.ts` | `createPendingBatch`, `prepareImport`, `commitImport`, `markImportBatchFailed` — Storage upload → `import_batch` / `spend_line`. |
| `analytics.ts` | `fetchSpendDateBounds`, `fetchSpendAggregates`, `fetchSpendLinesPage`, `fetchSpendLines` — date-range SQL RPC wrappers. Prefer **paged** `fetchSpendLinesPage` for UI. |
| `data-management.ts` | List batches; preview/delete by date range; delete import batch (+ prune empty). |
| `spend-lines.ts` | Create / update / delete single spend lines (manual batch support). |
| `table-prefs.ts` | Load/upsert per-user table column prefs (`user_table_pref`). |

## Conventions

- All files use `"use server"`.
- Only export async functions (not constants) — constants in `src/lib/spend/constants.ts`.
- Chunk size: `SPEND_LINE_CHUNK` (400 rows per insert / browse page size aligned with UI).
- Co-located tests in `*.test.ts`.
- Import as `@/api/<module>`.
- Large browse queries: rely on optimized `spend_lines_page` RPC (index-friendly paths); never rebuild OR/`to_char` filters that defeat indexes.
