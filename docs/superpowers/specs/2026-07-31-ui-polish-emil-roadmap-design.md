# UI polish roadmap (Emil design-eng)

**Date:** 2026-07-31  
**Status:** Phase 1 done; Phase 2–3 in `2026-07-31-ui-polish-phase2-3-design.md`  
**Skills:** `emil-design-eng`, `find-animation-opportunities`, `use-shadcn`

## Audit summary

App UI is functional shadcn/Base UI with little intentional motion or press feedback. Personality should stay a **crisp internal dashboard**: short motions, strong ease-out, no decorative chart animation.

### Review (emil-design-eng)

| Before | After | Why |
| --- | --- | --- |
| `Button` uses `transition-all` + `active:translate-y-px` | `transition` on transform/colors only + `active:scale-[0.97]` (~160ms, strong ease-out) | Avoid `all`; press must feel responsive |
| No shared `--ease-out` / `--ease-in-out` tokens | Add CSS vars from Emil vocabulary | Consistent punchy curves |
| Sidebar `transition-transform duration-200` (default ease) | Same duration with `--ease-out`; backdrop fades in/out | Instant-feeling open; spatial feedback |
| Mobile overlay appears/disappears with no opacity bridge | Fade overlay 150–200ms ease-out | Prevents jarring teleport |
| Popover/Select `duration-100` + `zoom-in-95` | Keep origin-aware; bump to ~150–200ms; ensure entry from ~0.95 | Under 300ms; never from `scale(0)` |
| Clickable analytics cards: hover ring only | Add subtle `active:scale-[0.99]` + transform transition | Feedback on pressable surfaces |
| Hover styles always applied | Prefer `@media (hover: hover) and (pointer: fine)` for scale/ring hover where we add them | Avoid sticky hover on touch |
| No `prefers-reduced-motion` policy | Soften transform motion; keep opacity/color | Accessibility without killing feedback |

### Animation opportunities (gated)

| # | Location | Today | Purpose | Frequency | Suggested motion |
| --- | --- | --- | --- | --- | --- |
| 1 | `button.tsx` | No scale press | Feedback | Tens/day | `active:scale-[0.97]`, `transform 160ms var(--ease-out)` |
| 2 | `app-sidebar.tsx` overlay | Instant mount | Preventing jarring change | Occasional | Opacity 0→1, 180ms `--ease-out` |
| 3 | Analytics KPI/chart cards | Instant click | Feedback | Occasional | `active:scale-[0.99]`, 140ms `--ease-out` |
| 4 | Detail sheet mount | Instant appear | Preventing jarring change | Occasional | `@starting-style` opacity + translateY(6px) → settled, 200ms |

### Rejected

- Recharts enter animations — **functional data; decoration hinders**
- Sidebar route link slide on every nav — **tens+/day; color change only**
- Landing marketing stagger — **out of Phase 1 scope**
- Toast system — **no toast usage yet; add Sonner later if needed**

## Phased roadmap

**Phase 1 (now):** motion tokens, button press, sidebar/overlay, analytics card press, detail enter, reduced-motion, hover media query where we touch hover.

**Phase 2:** Sonner for import success/errors; NumberFlow on KPI totals; virtualize huge detail tables (Virtuoso) if needed.

**Phase 3:** Optional empty-state delight on uploads/analytics (rare tier only).

## Non-goals

- Framer Motion for Phase 1 (CSS only)
- Redesigning brand colors or layout structure
- Animating chart series drawing
