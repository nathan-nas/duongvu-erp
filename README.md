# duongvu-erp

**Dương Vũ** internal spend management on **Vercel** + **Supabase**. Cursor agents are the primary contributors (see [AGENTS.md](AGENTS.md)).

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui (Josefin Sans display + navy/blue brand tokens)
- Zustand (client UI state only)
- Supabase Auth (email + password) + Postgres (`import_batch` / `spend_line`)
- Deploy: Vercel only
- CI: GitHub Actions (`lint`, `typecheck`, `test`)

## Local setup

### Prerequisites

- Node 22+
- [pnpm](https://pnpm.io/) 11+
- A Supabase project

### 1. Install

```bash
pnpm install
```

### 2. Environment

```bash
cp .env.example .env.local
```

Fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

From Supabase: **Project Settings → API**.

### 3. Supabase Auth

1. Authentication → Providers → **Email** enabled (password).
2. For local/dev convenience, you may disable **Confirm email** so signup reaches `/app` immediately.
3. Authentication → URL configuration: add `http://localhost:3000/**`.

### 4. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

| Route | Access |
|-------|--------|
| `/` | Public landing (brand hero) |
| `/login`, `/signup` | Email + password (branded auth shell) |
| `/app` | Signed-in home |
| `/app/uploads` | Excel spend upload |
| `/app/analytics` | Charts + Kỳ giao dịch filters |
| `/app/data` | Bulk delete + line browse/CRUD |

## Scripts

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Vercel deploy

1. Import this repo in Vercel (framework: Next.js, root directory: `.`).
2. Set the same env vars for **Preview** and **Production**.
3. Add your Vercel domains to Supabase Auth redirect URLs.
4. Deploy from `main`; PRs get preview URLs.

Do not add other hosts. See `.cursor/skills/vercel-deploy/SKILL.md`.

## Agent contribution

- [AGENTS.md](AGENTS.md) — how agents must work
- [CONTRIBUTING.md](CONTRIBUTING.md) — contribution guide for agents
- Specs: `docs/superpowers/specs/`
- Plans: `docs/superpowers/plans/`
- Project skills: `.cursor/skills/` (`project-conventions`, `brand-ui`, `use-shadcn`, `supabase-auth`, `vercel-deploy`, `add-feature`)
- Optional polish/SQL skills: `.agents/skills/` (Emil design-eng, Supabase)
- Brand assets: `public/brand/`

Recommended: install the [Superpowers](https://github.com/obra/superpowers) Cursor plugin for the shared brainstorm/plan/TDD workflow; this repo adds project-specific skills on top.
