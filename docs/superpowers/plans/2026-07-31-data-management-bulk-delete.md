# Implementation plan — Data management: bulk delete (Phase 1)

**Date:** 2026-07-31
**Spec:** [`docs/superpowers/specs/2026-07-31-data-management-delete-crud-design.md`](../specs/2026-07-31-data-management-delete-crud-design.md)
**Skills:** `add-feature`, `use-shadcn`, `supabase-auth`, `karpathy-guidelines`
**Scope:** Phase 1 only — delete by upload batch and delete by `payment_date` range from a new `/app/data` page. **No** row CRUD, **no** soft delete, **no** undo.

---

## 0. Assumptions & guardrails

- Follow current architecture: **Server Actions** in `src/api/` + **INVOKER RPCs** under RLS. No service-role key in client. No `NEXT_PUBLIC_*` secrets.
- All UI text in Vietnamese. Dark mode preserved.
- Existing `spend_line.batch_id → import_batch(id) ON DELETE CASCADE` already gives us batch deletion for free.
- Chunk large deletes with `SPEND_LINE_CHUNK = 400` (already exported from `src/lib/spend/constants.ts`). Loop server-side to avoid statement timeouts.
- Storage bucket `spend-uploads` is owner-only (path-prefix policy on `auth.uid()`); users can delete their own objects.
- Best-effort Storage cleanup: DB delete is the source of truth. Storage failures never roll back DB deletes; log and move on.
- No new tables. No org/business schema. `hard delete` only.

---

## 1. Task order (execute top-to-bottom)

1. **Migration** (SQL) — RPCs + grants.
2. **Server Action module** (`src/api/data-management.ts`) — auth-guarded, uses RPCs and direct RLS-filtered queries.
3. **Server Action unit tests** — mock Supabase (mirror `src/api/import-spend.test.ts`).
4. **shadcn Dialog primitive** — `pnpm dlx shadcn@latest add dialog --yes`.
5. **UI components** under `src/components/data/`.
6. **Route** `src/app/app/data/page.tsx` (server component) shell.
7. **Sidebar entry** — `src/components/app/app-sidebar.tsx`.
8. **Verify** — `pnpm lint && pnpm typecheck && pnpm test`. Apply migration to linked Supabase. Manual smoke on Vercel preview.

---

## 2. Migration — INVOKER RPCs

- [ ] Create `supabase/migrations/20260731170000_spend_bulk_delete.sql`.

Signatures (all `security invoker`, `set search_path = public`, granted only to `authenticated`):

- [ ] `spend_delete_preview(p_from date, p_to date)`
  - returns `table(row_count bigint, amount_sum numeric, batch_count_touched bigint)`
  - Counts + sum + `count(distinct batch_id)` over caller's `spend_line` where `payment_date between p_from and p_to`. `stable`, `sql`.

- [ ] `spend_delete_by_date_range(p_from date, p_to date, p_limit int)`
  - returns `bigint` (rows deleted this call)
  - `plpgsql`. Deletes up to `greatest(coalesce(p_limit, 400), 1)` rows using CTE `WITH victims AS (SELECT id FROM spend_line WHERE payment_date BETWEEN p_from AND p_to ORDER BY id LIMIT ...) DELETE ... USING victims`. Reads `GET DIAGNOSTICS ... = ROW_COUNT`. RLS ensures only caller's rows are eligible.

- [ ] `spend_prune_empty_batches()`
  - returns `table(id uuid, storage_path text, parsed_path text)`
  - `sql`. `DELETE FROM import_batch b WHERE NOT EXISTS (SELECT 1 FROM spend_line s WHERE s.batch_id = b.id) RETURNING b.id, b.storage_path, b.parsed_path`. RLS scopes to caller's batches; `NOT EXISTS` respects RLS on `spend_line`.

- [ ] Grants:
  - `revoke all on function public.<each>() from public;`
  - `grant execute on function public.spend_delete_preview(date, date) to authenticated;`
  - `grant execute on function public.spend_delete_by_date_range(date, date, int) to authenticated;`
  - `grant execute on function public.spend_prune_empty_batches() to authenticated;`

- [ ] **No** RPC for listing batches — the Server Action reads `import_batch` directly under RLS (matches `src/api/import-spend.ts` style).

**Do not** touch existing RPCs, indexes, or tables. Do not add a soft-delete column.

---

## 3. Server Actions — `src/api/data-management.ts`

- [ ] New file with `"use server"` header.
- [ ] Reuse the `requireUser()` pattern from `src/api/import-spend.ts` (copy locally — no premature abstraction).
- [ ] Import `SPEND_LINE_CHUNK` from `@/lib/spend/constants` and `SPEND_UPLOADS_BUCKET` from `@/lib/spend/storage-paths`.
- [ ] Vietnamese error strings: `Bạn cần đăng nhập.`, `Không xóa được dữ liệu.`, `Không tải được danh sách lô.`, `Ngày không hợp lệ.`.

### 3.1 `listImportBatches()`

- [ ] Returns
  ```
  { batches: Array<{
      id: string;
      source_filename: string;
      period_year: number;
      batch_kind: BatchKind;
      fact_rows: number;
      amount_sum: number;
      status: string;
      created_at: string;
      storage_path: string | null;
    }> }
  | { error: string }
  ```
- [ ] `supabase.from("import_batch").select("id, source_filename, period_year, batch_kind, fact_rows, amount_sum, status, created_at, storage_path").eq("user_id", user.id).order("created_at", { ascending: false })`.
- [ ] Map to plain objects (numbers via `Number(...)`).

### 3.2 `previewDeleteByDateRange({ from, to })`

- [ ] Validate `from` and `to` with `isIsoDate` from `@/lib/spend/date-range`; if invalid, return `{ error: "Ngày không hợp lệ." }`.
- [ ] Call `supabase.rpc("spend_delete_preview", { p_from: from, p_to: to })`.
- [ ] Return `{ rowCount, amountSum, batchCountTouched }` as numbers.

### 3.3 `deleteImportBatch(batchId: string)`

- [ ] Guard auth and `batchId` shape (non-empty string).
- [ ] Read batch first: `.select("id, storage_path, parsed_path").eq("id", batchId).eq("user_id", user.id).maybeSingle()`; if null, return `{ error: "Không xóa được dữ liệu." }`.
- [ ] `supabase.from("import_batch").delete().eq("id", batchId).eq("user_id", user.id)` — CASCADE removes `spend_line`.
- [ ] Best-effort Storage cleanup **after** DB delete succeeds:
  - Collect `[storage_path, parsed_path].filter(Boolean)`.
  - `supabase.storage.from(SPEND_UPLOADS_BUCKET).remove(paths)` inside `try { ... } catch {}`. Never fail the action on storage error.
- [ ] Return `{ ok: true }`.

### 3.4 `deleteSpendLinesByDateRange({ from, to })`

- [ ] Validate `from`/`to` (same as preview) and that `from <= to`.
- [ ] Loop calling `spend_delete_by_date_range` with `p_limit: SPEND_LINE_CHUNK` until the returned count is `< SPEND_LINE_CHUNK` (or `0`). Accumulate `deletedTotal`.
- [ ] Safety cap: hard-abort loop after **500 iterations** (200k rows) and return `{ error: "Không xóa được dữ liệu." }` with `deletedTotal` so we never spin forever on a runaway RPC.
- [ ] After the loop, call `supabase.rpc("spend_prune_empty_batches")`. Collect returned `storage_path`/`parsed_path` values (nullable).
- [ ] Best-effort `supabase.storage.from(SPEND_UPLOADS_BUCKET).remove(paths)` for pruned batches inside `try { ... } catch {}`.
- [ ] Return `{ ok: true, deletedRows: number, prunedBatches: number }`.

### 3.5 Cache invalidation

- [ ] After a successful delete action, call `revalidatePath("/app/data")` and `revalidatePath("/app/analytics")`.
- [ ] Client component additionally uses `router.refresh()` after showing the success toast so the page re-fetches server-rendered lists.

---

## 4. Server Action unit tests

- [ ] New file `src/api/data-management.test.ts`. Mirror the mocking pattern in `src/api/import-spend.test.ts` (module-level `vi.mock("@/lib/supabase/server", ...)`).
- [ ] Cases:
  - [ ] `listImportBatches` rejects unauthenticated caller with Vietnamese error.
  - [ ] `listImportBatches` returns mapped rows on success.
  - [ ] `previewDeleteByDateRange` rejects invalid ISO dates.
  - [ ] `previewDeleteByDateRange` returns `{ rowCount, amountSum, batchCountTouched }` from RPC.
  - [ ] `deleteImportBatch` rejects unauthenticated caller.
  - [ ] `deleteImportBatch` calls `.delete().eq("id", …).eq("user_id", …)` and best-effort `storage.remove`.
  - [ ] `deleteSpendLinesByDateRange` loops until returned count `< SPEND_LINE_CHUNK` then calls `spend_prune_empty_batches`.
  - [ ] `deleteSpendLinesByDateRange` swallows Storage errors without failing.
- [ ] No coverage requirement beyond ensuring the actions behave under happy + auth-failure paths.

---

## 5. shadcn Dialog primitive

- [ ] Run `pnpm dlx shadcn@latest add dialog --yes` (creates `src/components/ui/dialog.tsx`; respects `components.json` style `base-nova`).
- [ ] Do not hand-roll a modal or use `<dialog>`.

---

## 6. UI components — `src/components/data/`

Create a new folder (matches convention `src/components/<area>/`). Add a short `AGENTS.md` describing the folder if consistent with sibling folders (`src/components/spend/AGENTS.md` exists).

### 6.1 `src/components/data/data-management-page.tsx` (client)

- [ ] Wrapping client component. Props: `initialBatches` from server component.
- [ ] Composition:
  - Section header **“Quản lý dữ liệu”**.
  - `<BatchList batches={...} />`
  - `<DateRangeDelete boundsMin={...} boundsMax={...} />`

### 6.2 `src/components/data/batch-list.tsx` (client)

- [ ] Renders a `Card` with a compact table (native `<table>` styled with Tailwind — no new dependency).
- [ ] Columns (Vietnamese): `Tên file`, `Kỳ`, `Loại`, `Số dòng`, `Tổng tiền`, `Trạng thái`, `Ngày tải`, action.
- [ ] Format helpers: `formatVnd`, `formatViDate` (already in `@/lib/spend/format`).
- [ ] Batch-kind label reuses map from `confirm-import.tsx` — inline copy is fine; do not extract yet.
- [ ] Action column: `<Button variant="destructive" size="sm">Xóa lô</Button>` opens `<DeleteBatchDialog>`.
- [ ] Empty state: `Chưa có lô tải nào.` centered in card body.

### 6.3 `src/components/data/delete-batch-dialog.tsx` (client)

- [ ] shadcn `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`.
- [ ] Title: `Xóa lô tải lên?`
- [ ] Body summary block: filename, `Số dòng: {rows}`, `Tổng tiền: {vnd}`.
- [ ] Warning line in `text-destructive`: `Hành động này không thể hoàn tác.`
- [ ] Footer buttons: `<Button variant="outline">Hủy</Button>` + `<Button variant="destructive" disabled={pending}>Xóa</Button>`.
- [ ] On confirm: call `deleteImportBatch(batchId)`. On success: `toast.success("Đã xóa lô.")`, close dialog, `router.refresh()`. On error: `toast.error(result.error)`.

### 6.4 `src/components/data/date-range-delete.tsx` (client)

- [ ] Card with title `Xóa theo kỳ`.
- [ ] Two `DatePicker`s (`@/components/ui/date-picker`) labelled `Từ ngày` / `Đến ngày`. Wire `min`/`max` to `boundsMin`/`boundsMax`.
- [ ] Button `Xem trước` calls `previewDeleteByDateRange`; shows a summary:
  - `Số dòng sẽ xóa: {n}`
  - `Tổng tiền: {vnd}`
  - `Số lô ảnh hưởng: {n}` (rendered only when > 0)
  - If `rowCount === 0` show `Không có dữ liệu trong khoảng này.` and disable delete button.
- [ ] Button `Xóa` opens `<DeleteRangeDialog>` seeded with preview numbers.

### 6.5 `src/components/data/delete-range-dialog.tsx` (client)

- [ ] shadcn `Dialog`.
- [ ] Title: `Xóa dữ liệu theo kỳ?`
- [ ] Body: `Sẽ xóa {rows} dòng ({vnd}) trong {from} → {to}. Các lô rỗng sẽ bị dọn dẹp.`
- [ ] Warning line in `text-destructive`: `Hành động này không thể hoàn tác.`
- [ ] Footer: `Hủy` + `Xóa`.
- [ ] On confirm: call `deleteSpendLinesByDateRange({ from, to })`. Show `toast.loading("Đang xóa…")` (id) and swap to `toast.success` / `toast.error`. Close dialog, `router.refresh()`.

### 6.6 Copy conventions

- [ ] All strings Vietnamese, no emojis.
- [ ] Numbers via `.toLocaleString("vi-VN")` and `formatVnd`.
- [ ] Never expose Supabase error messages to the UI — surface the Vietnamese error strings returned by the Server Action.

---

## 7. Route `src/app/app/data/page.tsx`

- [ ] Server component. Fetch bounds + batches in parallel:
  - `const [bounds, batchesResult] = await Promise.all([fetchSpendDateBounds(), listImportBatches()]);`
- [ ] If `batchesResult` has `error`, still render the page with an empty list + Vietnamese error banner.
- [ ] Layout mirrors `src/app/app/analytics/page.tsx`:
  ```
  <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
    <h1 className="text-2xl font-semibold">Quản lý dữ liệu</h1>
    <DataManagementPage batches={...} boundsMin={bounds.min} boundsMax={bounds.max} />
  </main>
  ```
- [ ] No `searchParams` needed.

---

## 8. Sidebar

- [ ] `src/components/app/app-sidebar.tsx` — add navItem:
  ```
  { href: "/app/data", label: "Quản lý dữ liệu", icon: Database, exact: false }
  ```
- [ ] Import `Database` from `lucide-react`. Place item after `Phân tích`.

---

## 9. Storage cleanup notes

- **Batch delete** (`deleteImportBatch`): remove `storage_path` + `parsed_path` for the deleted batch. All objects under `${user_id}/${batch_id}/` are owned by caller; Storage RLS allows DELETE.
- **Date-range delete** (`deleteSpendLinesByDateRange`): rows deleted first, then `spend_prune_empty_batches()` returns pruned batches' `storage_path`/`parsed_path`; call `storage.remove` on those paths only. Batches that retain any rows keep their workbook and parsed JSON intact (the workbook still represents the original upload).
- Wrap every Storage `.remove(...)` call in `try/catch`; log to `console.warn` in development. Never fail the DB action on Storage error.
- **Known orphan case:** if the parent Storage folder contains unexpected extra files (unlikely — only workbook + `parsed.json`), they will not be cleaned up. Accept as caveat; do not enumerate directories.

---

## 10. Verification

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test` (Vitest — must include the new `data-management.test.ts`)
- [ ] Apply migration locally / to linked Supabase: `supabase db push` (or migration up via CLI).
- [ ] Manual smoke on preview deploy:
  - [ ] Sign in, navigate to `Quản lý dữ liệu`.
  - [ ] Delete one upload batch via `Xóa lô` → analytics no longer shows those rows.
  - [ ] Delete a small `payment_date` range → row count decreases, batches whose all rows fell in range disappear from list, storage objects for pruned batches are gone.
  - [ ] Attempt delete while signed out → server action returns Vietnamese auth error (no client-side bypass).

---

## 11. Success criteria (Phase 1 done)

- User can delete a single upload batch from `/app/data`; CASCADE removes `spend_line`; Storage objects best-effort removed; analytics reflects removal.
- User can delete a `payment_date` range; empty batches are pruned; Storage for pruned batches best-effort removed.
- All lint / typecheck / vitest checks pass; Vercel preview builds green.

---

## 12. Explicitly out of scope (defer to Phase 2 / 3)

- Row-level CRUD (`Sửa` / `Xóa` on individual `spend_line`).
- `Thêm dòng` and the auto-created **Nhập tay** batch.
- Multi-select bulk batch delete.
- Soft delete, recycle bin, undo.
- Audit log table.
- Editing an uploaded workbook in Storage.
- A full management browse/filter table on `/app/data` (Phase 3).

---

## 13. Rollback

- Migration is additive (three new functions + grants). To roll back: `drop function` for each of the three functions. No data or table changes to revert.
