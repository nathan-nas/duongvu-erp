---
name: brand-ui
description: Dương Vũ visual identity for login, landing, and shell. Use when changing auth pages, landing, theme tokens, logo, or branded chrome.
---

# Brand UI (Dương Vũ)

Commercial reference: https://duongvuvn.com/

## Assets (`public/brand/`)

| File | Use |
|------|-----|
| `logo.png` | Favicon, sidebar, auth mobile header, landing mark |
| `hero-rice.png` | Auth left panel (`AuthBrandPanel`) |
| `slider-fields.png` | Public landing hero |
| `hero-product.png` | Spare product photography — reuse before downloading new art |

Do not commit multi‑MB facility dumps. Prefer Web-optimized PNGs already in the folder.

## Code map

- Theme tokens: `src/app/globals.css` (`:root` / `.dark`) — navy sidebar, blue `--primary`
- Font: Josefin Sans → `--font-josefin` in `src/app/layout.tsx`; utility `font-display`
- Auth: `src/components/auth/auth-shell.tsx`, `auth-brand-panel.tsx`, forms, `/login` + `/signup` pages
- Landing: `src/app/page.tsx`
- Shell logo: `src/components/app/app-sidebar.tsx`

## Rules

- Keep Vietnamese copy; brand name is **Dương Vũ** (never “HOAI” as a product label).
- Preserve split auth layout on large screens; forms stay readable on mobile with logo row.
- When adjusting colors, stay in the navy / `#3a7eac` family already encoded in oklch tokens.
- Prefer updating existing brand components over one-off hero markup on each page.
