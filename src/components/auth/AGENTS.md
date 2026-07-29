# src/components/auth

Authentication form components.

## Components

| File | Purpose |
|------|---------|
| `login-form.tsx` | Email + password sign-in form (Vietnamese labels) |
| `signup-form.tsx` | Email + password sign-up form (Vietnamese labels) |

## Conventions

- Forms call server actions in `src/app/auth/actions.ts`.
- Error messages are translated to Vietnamese via `viError()` in the actions file.
- Uses shadcn `Input`, `Button`, `Label` components.
