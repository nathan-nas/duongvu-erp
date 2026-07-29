---
name: add-feature
description: End-to-end checklist to add a feature in duongvu-erp (brainstorm → spec → plan → TDD → PR). Use when implementing any non-trivial change.
---

# Add a feature

## Checklist

1. **Clarify** — purpose, success criteria, out of scope. Stop if product direction is undefined and the change invents ERP modules.
2. **Spec** — write `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`; get human approval for non-trivial work.
3. **Plan** — write `docs/superpowers/plans/YYYY-MM-DD-<topic>.md` with file paths and verification steps.
4. **Test first** when adding pure logic — failing Vitest, then minimal implementation.
5. **Implement** surgically; follow `project-conventions` and `supabase-auth` / `vercel-deploy` as needed.
6. **Verify** — `pnpm lint && pnpm typecheck && pnpm test`.
7. **PR** — human review + Vercel preview.

## Do not

- Skip CI gates
- Add org/business schema without an approved design
- Store auth session as Zustand source of truth
- Introduce a second deploy target
