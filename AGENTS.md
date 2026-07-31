# Agent operating guide (duongvu-erp)

You are a primary contributor to this repository. Humans review; agents implement.

## Brand

- App name: **Dương Vũ** (sidebar, landing, auth, metadata). Commercial site reference: https://duongvuvn.com/
- UI language: **Vietnamese** throughout.
- Dark mode: Tailwind `dark` class on `<html>`.
- Visual identity (do not invent a new palette):
  - Assets: `public/brand/` (`logo.png`, `hero-rice.png`, `slider-fields.png`, `hero-product.png`)
  - Theme tokens: navy + rice-field blue (`--primary` ≈ site `#3a7eac`) in `src/app/globals.css`
  - Display font: Josefin Sans via CSS var `--font-josefin` / utility `font-display`
  - Auth layout: `AuthShell` + `AuthBrandPanel` (full-bleed hero); landing uses fields hero

## Stack (do not change without an approved design)

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Zustand for **client UI state only** (never source of truth for auth)
- Supabase Auth (email + password) + Postgres
- Recharts for data visualization
- Deploy **only** on Vercel

## Current features (as of 2026-07-31)

1. **Auth** — email/password sign-up/in/out; branded split login/signup; Vietnamese errors.
2. **Spend upload** — Excel wizard: browser → Supabase Storage; Server Actions parse + chunked insert (`src/api/import-spend.ts`). UI in `src/components/spend/`, logic in `src/lib/spend/`.
3. **Analytics** — treemaps + monthly area chart; **Kỳ giao dịch** date range (`?from=&to=`); drill-down with chunked `spend_lines_page` + **Tải thêm** (avoid loading full ranges in one action).
4. **Data management** (`/app/data`) — delete by import batch or `payment_date` range; browse/edit/add/delete spend lines; manual rows use **Nhập tay** batch. Components in `src/components/data/`; actions in `src/api/data-management.ts` + `src/api/spend-lines.ts`.
5. **Shell** — navy branded sidebar (`AppSidebar` + logo) + topbar with dark-mode toggle; light UI polish (motion tokens, Sonner, NumberFlow KPIs, Virtuoso where needed).

## Key paths

| Purpose | Path |
|---------|------|
| App routes | `src/app/` |
| Brand assets | `public/brand/` |
| Spend feature logic | `src/lib/spend/` |
| Spend feature components | `src/components/spend/` |
| Data management UI | `src/components/data/` |
| App shell | `src/components/app/` |
| Auth UI | `src/components/auth/` |
| UI primitives (shadcn) | `src/components/ui/` |
| Zustand stores | `src/stores/` |
| App API (Server Actions) | `src/api/` |
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

- `project-conventions` — layout, naming, brand/UI/state rules
- `brand-ui` — logo, heroes, auth/landing chrome, theme tokens
- `use-shadcn` — prefer/install shadcn/ui instead of hand-rolled controls
- `supabase-auth` — auth, env vars, security boundaries
- `vercel-deploy` — Vercel-only deploy and env mapping
- `add-feature` — end-to-end feature checklist for this repo

Optional polish (installed under `.agents/skills/`):

- `emil-design-eng`, `find-animation-opportunities`, `improve-animations`, `review-animations` — motion/restraint
- `supabase`, `supabase-postgres-best-practices` — schema/SQL/RLS guidance

## Hard constraints

- No business/org tables until product is defined (`auth.users` + `import_batch` / `spend_line` only for now).
- Never put `SUPABASE_SERVICE_ROLE_KEY` in client code or `NEXT_PUBLIC_*`.
- Do not add Docker, Railway, or non-Vercel deploy paths.
- Do not invent ERP modules until a human asks for them.
- "HOAI" is an employee name, NOT a brand or feature label. Never use it in UI text.
- All user-facing text must be in Vietnamese.
- Do not replace brand assets/colors with generic AI purple/cream themes; reuse `public/brand/` and existing tokens.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full agent contribution guide.
