# src/components/spend

React components for the spend (expense) feature: upload wizard, analytics dashboard, and visualizations.

## Components

| File | Purpose |
|------|---------|
| `upload-wizard.tsx` | File picker; creates pending batch, uploads to Storage, calls prepareImport |
| `confirm-import.tsx` | Preview server stats, confirm year, commitImport |
| `analytics-dashboard.tsx` | Kỳ giao dịch date range + KPI cards + charts; drill-down via paginated RPC |
| `spend-treemap.tsx` | Recharts Treemap (by plant or expense code) |
| `spend-area-chart.tsx` | Recharts AreaChart (monthly trend) |
| `spend-bar-chart.tsx` | Recharts BarChart (legacy, may be removed) |
| `detail-sheet.tsx` | Slide-over panel with paginated contributing line items |

## Conventions

- Data visualization uses Recharts.
- Click interactions on charts update a drill-down state that opens `detail-sheet`.
- All labels in Vietnamese.
- Logic lives in `src/lib/spend/`; components only handle presentation + interaction.
