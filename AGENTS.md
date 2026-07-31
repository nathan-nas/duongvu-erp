# Agent operating guide (duongvu-erp)

You are a primary contributor to this repository. Humans review; agents implement.

## Brand

- App name: **Dương Vũ** (displayed in sidebar and landing page).
- UI language: **Vietnamese** throughout.
- Dark mode: supported via Tailwind `dark` class on `<html>`.

## Stack (do not change without an approved design)

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Zustand for **client UI state only** (never source of truth for auth)
- Supabase Auth (email + password) + Postgres
- Recharts for data visualization
- Deploy **only** on Vercel

## Current features (as of 2026-07-29)

1. **Auth** — email/password sign-up/in/out with Vietnamese error messages.
2. **Spend upload** — Excel upload wizard: browser uploads to Supabase Storage; Server Actions parse + chunked insert. Components in `src/components/spend/`, logic in `src/lib/spend/`.
3. **Analytics** — interactive treemaps (plant / expense code) + area chart (monthly trends) via Postgres RPCs + click-to-detail with paginated drill-down. Expandable chart cards.
4. **Shell layout** — persistent left sidebar (`AppSidebar`) + slim topbar (`AppTopbar`) with dark-mode toggle.

## Key paths

| Purpose | Path |
|---------|------|
| App routes | `src/app/` |
| Spend feature logic | `src/lib/spend/` |
| Spend feature components | `src/components/spend/` |
| App shell components | `src/components/app/` |
| Auth components | `src/components/auth/` |
| UI primitives (shadcn) | `src/components/ui/` |
| Zustand stores | `src/stores/` |
| Server actions | `src/app/app/actions/` |
| Supabase migrations | `supabase/migrations/` |
| Specs & plans | `docs/superpowers/specs/` / `docs/superpowers/plans/` |

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

- No business/org tables until product is defined (`auth.users` + `import_batch` / `spend_line` only for now).
- Never put `SUPABASE_SERVICE_ROLE_KEY` in client code or `NEXT_PUBLIC_*`.
- Do not add Docker, Railway, or non-Vercel deploy paths.
- Do not invent ERP modules until a human asks for them.
- "HOAI" is an employee name, NOT a brand or feature label. Never use it in UI text.
- All user-facing text must be in Vietnamese.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full agent contribution guide.
