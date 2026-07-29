---
name: vercel-deploy
description: Vercel-only deployment and environment mapping for duongvu-erp. Use when configuring deploy, env vars, or preview/production differences.
---

# Vercel deploy

## Policy

This app deploys **only** on Vercel. Do not add Dockerfiles, other PaaS configs, or alternate host docs.

## Project settings

- Root directory: repository root (Next.js app)
- Framework preset: Next.js
- Install: `pnpm install`
- Build: `pnpm build` (Vercel default for Next.js is fine)
- Production branch: `main`
- Pull requests: Preview deployments

## Environment variables

Set for **Preview** and **Production**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Use the same Supabase project for preview unless intentionally split. Document any split in the PR.

## Auth redirects

In Supabase Auth URL config, allow:

- `http://localhost:3000/**` (local)
- `https://<production-domain>/**`
- `https://*-<team>.vercel.app/**` (previews) as needed

## Agent checklist

1. Confirm no non-Vercel deploy artifacts.
2. Confirm env vars documented in README / `.env.example`.
3. After PR, verify Vercel preview build succeeds.
