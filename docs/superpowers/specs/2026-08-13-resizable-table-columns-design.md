# Thiết kế: cột bảng có thể kéo/đổi kích thước + ghi nhớ tùy chọn

## Mục tiêu

Cho phép người dùng chỉnh **độ rộng**, **thứ tự**, và **ẩn/hiện** cột trên mọi bảng dữ liệu trong app, và **đồng bộ theo tài khoản** qua Supabase (mọi thiết bị).

## Phạm vi

**Trong phạm vi**

- Shared `DataTable` (một primitive dùng chung).
- Migrate: bảng dòng chi + bảng nhóm trong `detail-sheet`, bảng lô tải trong `batch-list`.
- Prefs: `column_order`, `visible_ids`, `widths` (px).
- UX: kéo cạnh header để resize; kéo header để reorder (Excel-like); picker ẩn/hiện cột.
- Cột thao tác (nếu có) cố định bên phải, không lưu trong prefs.

**Ngoài phạm vi**

- Lưu sort direction / filter.
- Layout chia sẻ giữa nhiều user / org.
- Đổi thứ tự cột trong picker (chỉ drag header).

## Kiến trúc

1. **`DataTable`** — sở hữu resize, reorder, visibility, sticky header, scroll ngang, Virtuoso tùy chọn.
2. **`user_table_pref`** — một hàng `(user_id, table_id)`; RLS owner-only.
3. **Server Actions** — `getTableColumnPrefs` / `upsertTableColumnPrefs`.
4. **Pure merge** — hợp prefs đã lưu với định nghĩa cột mặc định (id lạ bị bỏ; id mới được append; ≥1 cột visible).

### `table_id`

| ID | Consumer |
|---|---|
| `spend_lines` | Bảng dòng chi (`DetailSheet` lines) |
| `spend_groups` | Bảng nhóm (`DetailSheet` groups) |
| `import_batches` | `BatchList` |

## Schema

```sql
create table public.user_table_pref (
  user_id uuid not null references auth.users (id) on delete cascade,
  table_id text not null,
  column_order text[] not null default '{}',
  visible_ids text[] not null default '{}',
  widths jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, table_id),
  constraint user_table_pref_table_id_check
    check (table_id ~ '^[a-z][a-z0-9_]{0,63}$'),
  constraint user_table_pref_widths_object
    check (jsonb_typeof(widths) = 'object')
);

alter table public.user_table_pref enable row level security;

create policy "user_table_pref_owner_all"
  on public.user_table_pref for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on table public.user_table_pref to authenticated;
```

## UX

- Resize: tay cầm ~4px cạnh phải header; cursor `col-resize`; min width theo cột (mặc định 64px).
- Reorder: drag header (không phải cột pinned/actions); drop target highlight nhẹ.
- Visibility: nút “Cột hiển thị” (giữ pattern hiện tại); không cho ẩn hết cột.
- Lưu: optimistic local state; debounce ~400ms rồi upsert.
- Không animate resize/drag (tần suất cao).

## Data flow

1. Mount: load prefs (hoặc defaults nếu chưa có / lỗi / chưa đăng nhập).
2. Merge với column defs → `order`, `visible`, `widths`.
3. User thao tác → cập nhật state → debounce save.
4. Merge lại khi defs đổi (cột mới sau deploy).

## Kiểm thử

- Pure: merge prefs (unknown ids, missing ids, empty visible, clamp widths).
- API: auth required; upsert shape; owner isolation (unit với mock client).
- UI: smoke via consumers vẫn render; lint/typecheck/test xanh.

## Tiêu chí hoàn thành

1. Cả ba bảng dùng `DataTable`.
2. Width / order / visibility persist theo user trên Supabase.
3. Cột thao tác không bị reorder/hide/persist width trong prefs payload (width cố định OK).
4. `pnpm lint && pnpm typecheck && pnpm test` pass.
