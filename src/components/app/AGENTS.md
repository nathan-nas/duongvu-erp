# src/components/app

Shell/layout components for the authenticated app area.

## Components

| File | Purpose |
|------|---------|
| `app-sidebar.tsx` | Persistent left sidebar: brand "Dương Vũ", nav links with icons, user profile + sign-out. Mobile-responsive (toggle via Zustand `sidebarOpen`). |
| `app-topbar.tsx` | Slim top bar: mobile hamburger, welcome message, `ThemeToggle`, user avatar. |

## Conventions

- Navigation links highlight active route using `usePathname()`.
- Dark mode toggle is in the topbar (`src/components/theme-toggle.tsx`).
- Sidebar state managed in `src/stores/ui-store.ts`.
