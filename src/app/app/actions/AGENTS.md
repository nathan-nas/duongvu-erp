# src/app/app/actions

Server actions for the authenticated app area.

## Files

| File | Purpose |
|------|---------|
| `import-spend.ts` | `createPendingBatch`, `prepareImport`, `commitImport`, `markImportBatchFailed` — Storage upload pipeline into `import_batch` / `spend_line`. |
| `analytics.ts` | `fetchSpendAggregates`, `fetchSpendLinesPage` — SQL RPC wrappers for charts and paginated drill-down. |

## Conventions

- All files use `"use server"` directive.
- Only export async functions (not constants) from server action files — constants go in `src/lib/spend/constants.ts`.
- Chunk size: `SPEND_LINE_CHUNK` (400 rows per insert).
- Co-located tests in `*.test.ts`.
