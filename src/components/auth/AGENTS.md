# src/components/auth

Authentication UI (branded shell + forms).

## Components

| File | Purpose |
|------|---------|
| `auth-shell.tsx` | Split layout: brand panel (lg+) + form column |
| `auth-brand-panel.tsx` | Full-bleed `/brand/hero-rice.png` + title/subtitle |
| `login-form.tsx` | Email + password sign-in (mobile logo row) |
| `signup-form.tsx` | Email + password sign-up (mobile logo row) |

## Conventions

- Pages `/login` and `/signup` wrap forms in `AuthShell` with Vietnamese marketing copy.
- Forms call server actions in `src/app/auth/actions.ts`.
- Errors translated via `viError()` in the actions file.
- Use shadcn `Input`, `Button`, `Label`, `Card`. Brand wordmarks use `font-display`.
- Logo: `/brand/logo.png`. See skill `brand-ui`.
