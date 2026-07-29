# src/components/spend

React components for the spend (expense) feature: upload wizard, analytics dashboard, and visualizations.

## Components

| File | Purpose |
|------|---------|
| `upload-wizard.tsx` | File picker + dropzone for Excel upload |
| `confirm-import.tsx` | Preview parsed data, chunk + submit to server actions |
| `analytics-dashboard.tsx` | KPI cards + expandable chart cards + filter controls |
| `spend-treemap.tsx` | Recharts Treemap (by plant or expense code) |
| `spend-area-chart.tsx` | Recharts AreaChart (monthly trend) |
| `spend-bar-chart.tsx` | Recharts BarChart (legacy, may be removed) |
| `detail-sheet.tsx` | Slide-over panel showing contributing line items on click |

## Conventions

- Data visualization uses Recharts.
- Click interactions on charts update a drill-down state that opens `detail-sheet`.
- All labels in Vietnamese.
- Logic lives in `src/lib/spend/`; components only handle presentation + interaction.
