# 2026-07-29 Agent-first repo init — design

## Goal

Initialize `duongvu-erp` as a Vercel-only Next.js shell with Supabase email/password auth and a Cursor agent operating system. Product/ERP modules are deferred.

## Decisions

- Single Next.js App Router app (not monorepo)
- Auth: email + password; protected `/app`
- No business tables or orgs (`auth.users` only)
- Agent OS: `AGENTS.md`, `CONTRIBUTING.md`, `.cursor/rules`, `.cursor/skills`, `docs/superpowers/{specs,plans}`, GitHub Actions CI
- UI: shadcn/ui + Zustand for client UI state only

## Surfaces

| Route | Behavior |
|-------|----------|
| `/` | Public landing |
| `/login`, `/signup` | Auth forms |
| `/app` | Requires session; sign out |

## Success criteria

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass
- Unauthenticated `/app` redirects to `/login` (middleware)
- Env documented for local + Vercel
