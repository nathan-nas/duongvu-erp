# src/app/app/actions

Server actions for the authenticated app area.

## Files

| File | Purpose |
|------|---------|
| `import-spend.ts` | `createImportBatch`, `insertSpendLines`, `markImportBatchFailed` — chunked Excel import into Supabase `spend_batch` / `spend_line` tables. |

## Conventions

- All files use `"use server"` directive.
- Only export async functions (not constants) from server action files — constants go in `src/lib/spend/constants.ts`.
- Chunk size: `SPEND_LINE_CHUNK` (400 rows per insert).
- Co-located tests in `*.test.ts`.
