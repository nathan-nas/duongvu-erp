# Supabase

Auth is managed by Supabase Auth (`auth.users`).

## Migrations

| File | Description |
|------|-------------|
| `20260729120000_hoai_spend.sql` | HOAI POC: `import_batch`, `spend_line`, RLS owner policies |

Apply via Supabase MCP (`apply_migration` name `hoai_spend`) or SQL editor on project `mcqarpgqsjpyzjkhquay`.

When adding new tables:

1. Add SQL under `migrations/`
2. Enable RLS
3. Document policies in the design spec
