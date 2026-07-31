# src/components/data

Data management page (`/app/data`): bulk delete and spend-line browse/CRUD.

## Components

| File | Purpose |
|------|---------|
| `data-management-page.tsx` | Client shell: batches, date-range delete, line browser |
| `batch-list.tsx` | Import batches table + per-batch delete |
| `delete-batch-dialog.tsx` | Confirm single batch delete |
| `date-range-delete.tsx` | Date pickers, preview, delete by `payment_date` |
| `delete-range-dialog.tsx` | Confirm date-range delete |
| `line-browser.tsx` | Paginated line list (**Tải thêm**) with row edit/delete hooks |

## Conventions

- Bulk delete / batch list: `src/api/data-management.ts`.
- Row CRUD: `src/api/spend-lines.ts` (+ shared form dialogs under `src/components/spend/` when reused).
- Manual inserts go to the **Nhập tay** import batch.
- Vietnamese labels; shadcn `Dialog` + `DatePicker`.
- Do not fetch entire date ranges at once — page via `fetchSpendLinesPage`.
