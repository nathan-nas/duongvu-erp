# Next.js backend: Storage ingest + SQL analytics

**Date:** 2026-07-31  
**Status:** Approved

## Summary

Move Excel ingest and analytics queries into the Next.js server (same Vercel deploy). The browser uploads `.xlsx` to Supabase Storage; the server downloads, parses, and inserts. Analytics uses Postgres RPCs for plant / expense / monthly series and paginated drill-down — the FE no longer receives the full `spend_line` dump.

## Goals

- Trustworthy ingest (server is source of truth for parse + totals)
- Avoid Vercel ~4.5MB Server Action body limits for Excel bytes
- Scale analytics via SQL aggregates + indexes
- Keep one deploy target (Vercel + Next.js App Router)

## Non-goals

- Separate API service, Edge Functions, Docker/non-Vercel hosts
- Org/multi-tenant schema or service-role admin APIs
- Materialized views / continuous aggregates

## Architecture

1. **createPendingBatch** — insert `import_batch` with status `pending`; return `batchId` + Storage path.
2. **Browser** — upload file to private bucket `spend-uploads` under `{user_id}/{batch_id}/...`.
3. **prepareImport** — download xlsx, parse, write parsed JSON cache, return preview stats.
4. **commitImport** — re-parse xlsx with confirmed `period_year`, chunk-insert lines, set `ready` with server-computed totals.
5. **Analytics** — RSC loads batch list + three agg RPCs; detail sheet calls `fetchSpendLinesPage`.

## Schema

- `import_batch.status`: `pending | processing | ready | failed`
- Columns: `storage_path`, `parsed_path`
- Composite indexes on `spend_line (batch_id, plant_name|expense_code|payment_date)`
- RPCs (`SECURITY INVOKER`, grant to `authenticated`):
  - `spend_agg_by_plant`, `spend_agg_by_expense`, `spend_agg_by_month`
  - `spend_lines_page` (filter + limit/offset + total)

## Security

- User session client only (anon key + JWT); no service role in app
- Table RLS: `auth.uid() = user_id`
- Storage policies: CRUD only under `{auth.uid()}/...`
- RPCs rely on RLS via `SECURITY INVOKER`

## UI (Vietnamese)

- Upload wizard: pick file → Storage upload → server preview → confirm year → commit
- Analytics: chart-ready series as props; paginated lines on drill-down
