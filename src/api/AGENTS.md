# src/api

Server-side API for the authenticated app (Next.js Server Actions).

## Files

| File | Purpose |
|------|---------|
| `import-spend.ts` | `createPendingBatch`, `prepareImport`, `commitImport`, `markImportBatchFailed` — Storage upload pipeline into `import_batch` / `spend_line`. |
| `analytics.ts` | `fetchSpendDateBounds`, `fetchSpendAggregates`, `fetchSpendLinesPage` — date-range SQL RPC wrappers. |

## Conventions

- All files use `"use server"` directive.
- Only export async functions (not constants) from these modules — constants go in `src/lib/spend/constants.ts`.
- Chunk size: `SPEND_LINE_CHUNK` (400 rows per insert).
- Co-located tests in `*.test.ts`.
- Import as `@/api/<module>`.
