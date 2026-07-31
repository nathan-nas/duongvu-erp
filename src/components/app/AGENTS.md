# src/components/app

Shell/layout components for the authenticated app area.

## Components

| File | Purpose |
|------|---------|
| `app-sidebar.tsx` | Navy branded sidebar: `/brand/logo.png` + "Dương Vũ", nav (Trang chủ, Tải lên, Phân tích, Quản lý dữ liệu), profile + sign-out. Mobile drawer via Zustand `sidebarOpen`. |
| `app-topbar.tsx` | Slim top bar: mobile hamburger, welcome message, `ThemeToggle`, user avatar initial. |

## Conventions

- Navigation highlights active route with `usePathname()`.
- Sidebar uses `bg-sidebar` tokens (navy in light and dark).
- Brand title uses `font-display`.
- Dark mode toggle lives in the topbar (`src/components/theme-toggle.tsx`).
- Sidebar state: `src/stores/ui-store.ts`.
