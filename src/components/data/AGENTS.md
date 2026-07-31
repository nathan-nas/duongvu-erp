# src/components/data

React components for the data management page (`/app/data`): bulk delete by upload batch or payment date range.

## Components

| File | Purpose |
|------|---------|
| `data-management-page.tsx` | Client shell: batch list + date-range delete |
| `batch-list.tsx` | Table of import batches with per-batch delete |
| `delete-batch-dialog.tsx` | Confirm dialog for single batch delete |
| `date-range-delete.tsx` | Date pickers, preview, and delete trigger |
| `delete-range-dialog.tsx` | Confirm dialog for date-range delete |

## Conventions

- Server Actions live in `src/api/data-management.ts`.
- All labels in Vietnamese.
- Use shadcn `Dialog` for confirmations; `DatePicker` for dates.
