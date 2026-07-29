# HOAI final review fixes — implementation plan

1. Add a date regression test for `3102` and validate constructed year-month-day values. Verify the focused Vitest file fails, then passes.
2. Add a server-action test for marking an owned import batch failed. Implement the action and call it after a failed chunk. Verify focused action tests pass.
3. Add and apply the owner-consistency trigger migration. Verify Supabase accepts the migration.
4. Run `pnpm lint`, `pnpm typecheck`, and `pnpm test`.
