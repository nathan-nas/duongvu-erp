---
name: project-conventions
description: Folder layout, naming, brand, shadcn/zustand usage for duongvu-erp. Use when adding UI, routes, stores, or organizing files.
---

# Project conventions

## Layout

- App routes: `src/app/`
- Brand assets: `public/brand/` (logo + heroes from duongvuvn.com — reuse, do not invent)
- UI primitives: `src/components/ui/` (shadcn)
- Feature components: `src/components/<area>/` (`spend/`, `data/`, `app/`, `auth/`)
- Feature logic/utils: `src/lib/<area>/` (e.g. `src/lib/spend/`)
- Supabase helpers: `src/lib/supabase/`
- Auth path helpers: `src/lib/auth/`
- Zustand stores: `src/stores/`
- App API (Server Actions): `src/api/`

## Naming

- Components: PascalCase files for multi-export modules; kebab-case for route segments and most component files (`login-form.tsx`).
- App API / Server Actions: `src/api/<name>.ts` with `"use server"` (auth page actions may stay under `src/app/auth/`).
- Shared constants: `src/lib/<area>/constants.ts`.

## Brand and UI

- All user-facing text in Vietnamese.
- Dark mode via `dark` class on `<html>` (toggled by `ThemeToggle`).
- Prefer shadcn primitives in `src/components/ui/` before custom controls; add missing ones via `pnpm dlx shadcn@latest add <name>`. See skill `use-shadcn` and rule `use-shadcn`.
- Date fields: `@/components/ui/date-picker` (not `<input type="date">`).
- Display headings / brand wordmarks: `font-display` (Josefin Sans). Body remains Geist / sans.
- Theme: keep navy sidebar + blue primary from `globals.css`; do not restyle to generic purple/cream AI looks.
- Auth pages: wrap forms in `AuthShell` (uses `AuthBrandPanel` + `/brand/hero-rice.png`). Landing: full-bleed `/brand/slider-fields.png`.
- Logo: `/brand/logo.png` (sidebar, auth mobile header, favicon metadata).
- Zustand is for client UI only (sidebar toggle, menus). Session/user always from Supabase server or client helpers.
- Keep pages thin; put logic in `lib/` or `src/api/`.
- Data visualization: Recharts. Prefer short ease-out motion; avoid decorative chart animation (see `.agents/skills/emil-design-eng` when polishing).
- Large line tables: Virtuoso + **Tải thêm** pagination via `fetchSpendLinesPage` — do not load entire date ranges in one Server Action.

## Tests

- Unit tests: `*.test.ts` next to the module or under the same folder.
- Run with `pnpm test` (Vitest).
