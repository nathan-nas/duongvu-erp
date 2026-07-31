---
name: use-shadcn
description: >-
  Prefer and install shadcn/ui primitives instead of hand-rolled controls.
  Use when adding or changing UI (forms, buttons, dialogs, selects, date pickers,
  popovers, calendars), or when tempted to use raw HTML inputs/modals for
  standard controls in duongvu-erp.
---

# Use shadcn/ui

## Rule

Never reinvent UI that shadcn already provides. Extend `src/components/ui/` first.

## Workflow

1. Check `src/components/ui/` for an existing primitive.
2. If missing, install with the project CLI (non-interactive):

```bash
pnpm dlx shadcn@latest add <component> --yes
```

Respect [`components.json`](../../components.json) (`style: base-nova`, aliases under `@/components/ui`).

3. Compose documented patterns instead of inventing APIs:

| Need | Use |
|------|-----|
| Button / Input / Label / Card / Select | Existing `@/components/ui/*` |
| Date single pick | `@/components/ui/date-picker` (`Popover` + `Calendar`) |
| Calendar only | `@/components/ui/calendar` |
| Floating panel | `@/components/ui/popover` |
| Toast | `@/components/ui/sonner` (`toast` from `sonner`) |

4. Match Base UI / shadcn v4 trigger style used in this repo (`PopoverTrigger` / `SelectTrigger` with `render={<Button ... />}` where required).
5. User-facing copy stays Vietnamese.

## Do not

- `<input type="date">` for product date fields
- Custom modal/backdrop stacks when Dialog/Sheet/Popover exists (add them via CLI if missing)
- Copy-paste third-party UI kits that fight Tailwind tokens / `base-nova`
- Put feature-specific styling into `ui/` — keep primitives generic; compose in `src/components/<feature>/`

## Date values

Prefer ISO `YYYY-MM-DD` strings at feature boundaries. Convert with `isoToLocalDate` / `localDateToIso` from `@/lib/spend/date-range` (or shared date helpers) so calendars do not shift a day in UTC.

## Verify

After adding UI primitives: `pnpm lint && pnpm typecheck` (and `pnpm test` if logic changed).
