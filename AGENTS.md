# Agent operating guide (duongvu-erp)

You are a primary contributor to this repository. Humans review; agents implement.

## Stack (do not change without an approved design)

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Zustand for **client UI state only** (never source of truth for auth)
- Supabase Auth (email + password) + Postgres
- Deploy **only** on Vercel

## Mandatory workflow

1. Clarify / design before coding (brainstorm when scope is unclear).
2. Write or update a design under `docs/superpowers/specs/`.
3. Write an implementation plan under `docs/superpowers/plans/`.
4. Implement with tests; keep changes surgical.
5. Ensure `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass (CI must pass).
6. Prefer a PR so Vercel preview validates the deploy.

## Project skills

Follow skills in `.cursor/skills/` when relevant:

- `project-conventions` — layout, naming, UI/state rules
- `supabase-auth` — auth, env vars, security boundaries
- `vercel-deploy` — Vercel-only deploy and env mapping
- `add-feature` — end-to-end feature checklist for this repo

## Hard constraints

- No business/org tables until product is defined (`auth.users` only for now).
- Never put `SUPABASE_SERVICE_ROLE_KEY` in client code or `NEXT_PUBLIC_*`.
- Do not add Docker, Railway, or non-Vercel deploy paths.
- Do not invent ERP modules until a human asks for them.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full agent contribution guide.
