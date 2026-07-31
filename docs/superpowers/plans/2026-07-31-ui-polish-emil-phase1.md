# UI polish Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply Emil design-eng + animation-opportunity Phase 1 polish (tokens, press feedback, sidebar overlay, detail enter).

**Architecture:** CSS variables + utility classes in `globals.css`; surgical class updates on shadcn Button, shell sidebar, analytics cards, detail sheet, Select/Popover durations. No Framer Motion.

**Tech Stack:** Tailwind CSS v4, existing shadcn/Base UI components.

---

### Task 1: Motion tokens + utilities

**Files:** `src/app/globals.css`

- [x] Add `--ease-out`, `--ease-in-out`, `--ease-drawer`
- [x] Add `.pressable-card`, `.motion-enter`, reduced-motion rules
- [x] Hover ring only under `@media (hover: hover) and (pointer: fine)`

### Task 2: Button press

**Files:** `src/components/ui/button.tsx`

- [x] Replace `transition-all` + `translate-y-px` with transform/color transition + `active:scale-[0.97]` (skip `aria-haspopup`)

### Task 3: Shell sidebar

**Files:** `src/components/app/app-sidebar.tsx`

- [x] Keep overlay mounted; fade opacity; drawer uses `--ease-out`

### Task 4: Analytics + detail + upload

**Files:**
- `src/components/spend/analytics-dashboard.tsx`
- `src/components/spend/detail-sheet.tsx`
- `src/components/spend/upload-wizard.tsx`
- `src/components/ui/popover.tsx`
- `src/components/ui/select.tsx`

- [x] Clickable cards → `pressable-card`
- [x] Detail sheet → `motion-enter`
- [x] Upload dropzone active scale
- [x] Popover/Select duration ~150ms

### Task 5: Verify

- [x] `pnpm lint && pnpm typecheck && pnpm test`
