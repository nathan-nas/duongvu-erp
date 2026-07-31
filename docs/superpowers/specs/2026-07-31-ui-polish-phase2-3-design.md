# UI polish Phase 2–3 design

**Date:** 2026-07-31  
**Status:** Approved (continue from Phase 1 roadmap)  
**Skills:** `use-shadcn`, `emil-design-eng`, `karpathy-guidelines`

## Scope

### Phase 2

1. **Sonner toasts** — shadcn `sonner` in root layout.
   - Upload: `toast.error` on create/upload/prepare failures (keep short inline text for same-step context).
   - Confirm import: `toast.error` on commit failure; `toast.success` then navigate to `/app/analytics` (drop obsolete `?batch=`).
2. **NumberFlow on KPIs** — `@number-flow/react` for Tổng chi (VND), Số nhà máy, Số mã chi. No chart number animation.
3. **Virtuoso** — `react-virtuoso` `TableVirtuoso` in detail sheet when sorted row count ≥ **40**. Below that, keep plain `<table>` (YAGNI for tiny lists). Height ~560px inside existing max scroll area. Server paging unchanged.

### Phase 3

4. **Empty-state delight (rare only)** — analytics “Chưa có dữ liệu” and upload dropzone idle state: one soft enter (`motion-enter` / light icon float), Lucide icon instead of emoji where easy. No confetti, no continuous loops that compete with work.

## Non-goals

- Toasts on every form validation (date range stays inline).
- Auth login/signup toasts (inline errors stay).
- Virtualizing Recharts.
- Framer Motion.

## Success

- Lint / typecheck / tests pass.
- Toast appears on import success/failure; KPIs animate on range change; large detail tables scroll smoothly; empty states feel slightly warmer without noise.
