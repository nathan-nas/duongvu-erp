---
name: project-conventions
description: Folder layout, naming, shadcn/zustand usage for duongvu-erp. Use when adding UI, routes, stores, or organizing files.
---

# Project conventions

## Layout

- App routes: `src/app/`
- UI primitives: `src/components/ui/` (shadcn)
- Feature components: `src/components/<area>/` (e.g. `src/components/spend/`, `src/components/app/`, `src/components/auth/`)
- Feature logic/utils: `src/lib/<area>/` (e.g. `src/lib/spend/`)
- Supabase helpers: `src/lib/supabase/`
- Auth path helpers: `src/lib/auth/`
- Zustand stores: `src/stores/`
- Server actions: `src/app/app/actions/`

## Naming

- Components: PascalCase files for multi-export modules; kebab-case for route segments and most component files (`login-form.tsx`).
- Server Actions: `src/app/**/actions.ts` or `src/app/**/actions/<name>.ts` with `"use server"`.
- Shared constants: `src/lib/<area>/constants.ts`.

## UI and state

- All user-facing text in Vietnamese.
- Dark mode via `dark` class on `<html>` (toggled by `ThemeToggle` component).
- Prefer shadcn primitives before custom CSS.
- Zustand is for client UI only (sidebar toggle, menus). Session/user always from Supabase server or client helpers.
- Keep pages thin; put logic in `lib/` or server actions.
- Data visualization: use Recharts (Treemap, AreaChart, etc.).

## Tests

- Unit tests: `*.test.ts` next to the module or under the same folder.
- Run with `pnpm test` (Vitest).
