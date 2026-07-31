# Data management roadmap — bulk delete + row CRUD

**Date:** 2026-07-31  
**Status:** Phase 1–3 implemented (2026-07-31)  
**Skills:** brainstorming, writing-plans, add-feature, use-shadcn, supabase-auth

## Goals

1. Let users remove bad/imported data by **upload batch** or by **payment_date range**.
2. Later: **add / edit / delete** spend line field data from analytics and (later) the management page.

## Decisions (locked)

| Topic | Choice |
| --- | --- |
| Scope | One roadmap; **implement delete first** |
| Date-range delete | Delete matching lines; **remove batches that become empty** |
| UI home | New sidebar page **“Quản lý dữ liệu”** (`/app/data`) |
| Row CRUD placement | Analytics detail first; fuller management page later |
| Manual add batch | Auto-create / reuse one **“Nhập tay”** batch per user |
| Architecture | Server Actions + INVOKER RPCs (same as analytics/import) |
| Soft delete | No — hard delete with confirm |

## Current schema leverage

- `spend_line.batch_id` → `import_batch(id)` **ON DELETE CASCADE**
- RLS: owner-only on both tables
- Analytics already filters by `payment_date`; detail table shows all rows (Virtuoso)

## Phase 1 — Bulk delete (ship first)

### Route & nav

- `/app/data` — **Quản lý dữ liệu**
- Sidebar entry (e.g. Database / Files icon), Vietnamese label

### UI

**Section A — Lô tải lên**

- List ready (and optionally failed) `import_batch` for the user: filename, period year, kind, fact_rows, amount_sum, created_at, status
- Action **Xóa lô** → confirm dialog showing rows + amount → delete batch (CASCADE lines)
- Best-effort: delete Storage object under `storage_path` if present

**Section B — Xóa theo kỳ**

- From / To DatePickers (reuse `DatePicker`)
- Preview: row count + total amount for range (RPC)
- Confirm → delete lines in chunks by `payment_date` range → prune empty batches for that user
- Toast success/error (Sonner)

### Server API (`src/api/`)

- `listImportBatches()`
- `previewDeleteByDateRange({ from, to })` → `{ rowCount, amountSum, batchCountTouched }`
- `deleteImportBatch(batchId)`
- `deleteSpendLinesByDateRange({ from, to })` — chunked; then delete empty batches

### RPCs / SQL (INVOKER)

- `spend_delete_preview(p_from, p_to)` — count/sum for user
- `spend_delete_by_date_range(p_from, p_to, p_limit)` — delete up to N rows, return deleted count (loop in action)
- `spend_prune_empty_batches()` — delete user’s `import_batch` with no remaining lines
- Batch delete can be plain `DELETE FROM import_batch WHERE id = …` under RLS (CASCADE)

### Safety

- Confirm dialog: summary numbers + checkbox or clear “không hoàn tác” copy
- Never expose service role to client

### Out of Phase 1

- Soft delete / recycle bin  
- Undo  
- Row add/edit  
- Multi-select batch delete (nice-to-have; single-row actions OK)

## Phase 2 — Row CRUD (analytics first)

### Analytics detail sheet

- Row actions: **Sửa** / **Xóa**
- Edit: dialog/sheet with editable fields (payment_date, party, item, qty, unit_price, amount, plant, expense_code, …)
- Delete row: confirm → `DELETE spend_line` (RLS); if batch emptied, prune optional
- **Thêm dòng**: insert into user’s **Nhập tay** batch (ensure exists)

### Nhập tay batch

- One `import_batch` per user: `source_filename = 'Nhập tay'`, `batch_kind = 'unknown'` (or new enum value later — YAGNI: reuse unknown)
- `ensureManualBatch()` server helper

### API

- `createSpendLine(input)`
- `updateSpendLine(id, patch)`
- `deleteSpendLine(id)`
- Recalc batch `fact_rows` / `amount_sum` after mutations (RPC or trigger — prefer small RPC)

## Phase 3 — Full management CRUD

- On `/app/data`: browse/filter lines (date + optional batch), same edit/add/delete as analytics
- Optional: column visibility already exists in detail sheet — reuse patterns

## Non-goals

- Org/multi-tenant tables  
- Audit log table (unless requested later)  
- Editing Excel in Storage  

## Success criteria

**Phase 1:** User can delete one upload batch or a date range from `/app/data`; empty batches disappear; analytics reflects removal; lint/typecheck/test pass.

**Phase 2:** User can add/edit/delete a line from analytics detail; manual rows land in Nhập tay.

**Phase 3:** Same CRUD from management page.
