---
name: supabase-auth
description: Supabase Auth patterns, env vars, and security for this Next.js app. Use when touching login, signup, middleware, or Supabase clients.
---

# Supabase auth

## Env vars

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Never expose the service role key in this shell. Do not add `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`.

## Clients

- Browser: `src/lib/supabase/client.ts` (`createBrowserClient`)
- Server: `src/lib/supabase/server.ts` (`createServerClient` + cookies)
- Middleware refresh: `src/lib/supabase/middleware.ts` via `src/middleware.ts`

## Routes

- Public: `/`, `/login`, `/signup`
- Protected: `/app/**` — unauthenticated users redirect to `/login`
- Authenticated users hitting `/login` or `/signup` redirect to `/app`

## Auth method

Email + password via `signUp` / `signInWithPassword` in `src/app/auth/actions.ts`.

## Local Supabase project setup

1. Create a Supabase project.
2. Enable Email provider (password).
3. For local/dev, you may disable "Confirm email" in Auth settings so signup reaches `/app` immediately. Re-enable confirmation for production when ready.
4. Copy URL and anon key into `.env.local` (see `.env.example`).

## Schema policy

No business tables yet. Do not add `profiles` or orgs unless a design doc says so. When adding tables later: enable RLS, policies for `auth.uid()`, migrations under `supabase/migrations/`.
