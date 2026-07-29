---
name: project-conventions
description: Folder layout, naming, shadcn/zustand usage for duongvu-erp. Use when adding UI, routes, stores, or organizing files.
---

# Project conventions

## Layout

- App routes: `src/app/`
- UI primitives: `src/components/ui/` (shadcn)
- Feature components: `src/components/<area>/`
- Supabase helpers: `src/lib/supabase/`
- Auth path helpers: `src/lib/auth/`
- Zustand stores: `src/stores/`

## Naming

- Components: PascalCase files for multi-export modules; kebab-case for route segments and most component files (`login-form.tsx`).
- Server Actions: `src/app/**/actions.ts` with `"use server"`.

## UI and state

- Prefer shadcn primitives before custom CSS.
- Zustand is for client UI only (menus, toggles). Session/user always from Supabase server or client helpers.
- Keep pages thin; put logic in `lib/` or server actions.

## Tests

- Unit tests: `*.test.ts` next to the module or under the same folder.
- Run with `pnpm test`.
