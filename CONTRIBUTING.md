# Contributing (written for Cursor agents)

This project expects **Cursor agents** as the main implementers. Humans approve designs, merge PRs, and set product direction.

## Before you write code

1. Read [AGENTS.md](AGENTS.md) and the relevant `.cursor/skills/*/SKILL.md`.
2. If the change is non-trivial, produce a short design in `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.
3. Break work into a plan in `docs/superpowers/plans/YYYY-MM-DD-<topic>.md` with verifiable steps.

## While implementing

- Touch only files required by the plan.
- Match existing patterns in `src/`.
- Prefer Server Components and Server Actions for auth and data.
- Use shadcn components from `src/components/ui/`; add new ones via `pnpm dlx shadcn@latest add <name>`.
- Put ephemeral UI state in Zustand (`src/stores/`). Do **not** mirror the Supabase session into Zustand as authority.
- Add or update Vitest unit tests for pure helpers and logic.

## Before you claim done

Run locally:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

CI runs the same gates on pull requests. Do not ask to merge with failing CI.

## Pull requests

- Title: imperative, concise (e.g. `Add login form error states`).
- Body: what changed, how to verify, link to spec/plan if any.
- Rely on Vercel preview for deploy verification.

## Out of scope unless explicitly requested

- ERP domain modules, orgs/teams, roles, billing
- Profiles table, Storage, Edge Functions
- Non-Vercel hosting
