# src/components/spend

React components for spend upload, analytics, and line editing UI.

## Components

| File | Purpose |
|------|---------|
| `upload-wizard.tsx` | File picker → pending batch → Storage → `prepareImport` |
| `confirm-import.tsx` | Preview stats, confirm year, `commitImport` |
| `analytics-dashboard.tsx` | Kỳ giao dịch date range + KPIs + charts (nhà máy / mã chi / đối tác / tháng); drill-down with **Tải thêm** |
| `spend-treemap.tsx` | Recharts Treemap (plant / expense / party) |
| `spend-area-chart.tsx` | Recharts AreaChart (monthly trend) |
| `detail-sheet.tsx` | Slide-over contributing lines (Virtuoso when large); optional row CRUD |
| `spend-line-form-dialog.tsx` | Add/edit spend line |
| `spend-line-delete-dialog.tsx` | Confirm row delete |

## Conventions

- Charts: Recharts; short UI motion only — no decorative chart animation.
- Drill-down / browse: `fetchSpendLinesPage` + **Tải thêm**, not full-range loads.
- Labels in Vietnamese.
- Logic in `src/lib/spend/`; Server Actions in `src/api/`.
