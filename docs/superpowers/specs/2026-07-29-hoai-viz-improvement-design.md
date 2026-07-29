# HOAI Analytics Visualization Improvement

**Date:** 2026-07-29  
**Status:** Approved

## Summary

Replace boring bar charts with treemaps + area chart. Add click-to-detail via slide-over panel.

## Charts

1. **Treemap "Chi theo nhà máy (NM)"** — proportional blocks, top 15 plants, remainder as "Khác". Color-coded.
2. **Treemap "Chi theo mã chi phí (MÃ)"** — top 15 expense codes, same treatment.
3. **Area chart "Xu hướng chi theo tháng"** — monthly spend trend, filled area.

## Click-to-Detail Interaction

- Click any treemap block → opens shadcn **Sheet** (right slide-over panel)
- Panel header: clicked label + formatted total amount
- Panel body: filtered Chi Tiết table (same columns as main table)
- Close via X button or click outside
- Clicking a different block updates panel content in-place

## KPI Cards

Keep existing 4: Tổng chi, Số dòng, Số NM, Số mã chi.

## Bottom Detail Table

Remains full unfiltered data. Slide panel is the drill-down mechanism.

## Tech

- Recharts `Treemap` with custom `content` renderer + `onClick`
- Recharts `AreaChart` for monthly trend
- shadcn/ui `Sheet` component for slide-over
- Client-side filtering (all data already in memory)
- No new server actions or DB changes needed

## Files to Change

- `src/components/hoai/analytics-dashboard.tsx` — replace bar charts with treemaps + area, add state + Sheet
- `src/components/hoai/spend-bar-chart.tsx` → keep for area chart reuse or delete
- New: `src/components/hoai/spend-treemap.tsx`
- New: `src/components/hoai/spend-area-chart.tsx`
- New: `src/components/hoai/detail-sheet.tsx` (slide panel with filtered table)
