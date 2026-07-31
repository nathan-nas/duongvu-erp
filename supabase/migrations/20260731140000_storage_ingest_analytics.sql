-- Storage ingest + SQL analytics RPCs
-- Extends import_batch status, adds storage paths, composite indexes, INVOKER RPCs, spend-uploads bucket.

-- ---------------------------------------------------------------------------
-- import_batch: status + storage paths
-- ---------------------------------------------------------------------------
alter table public.import_batch
  drop constraint if exists import_batch_status_check;

alter table public.import_batch
  add constraint import_batch_status_check
  check (status in ('pending', 'processing', 'ready', 'failed'));

alter table public.import_batch
  add column if not exists storage_path text,
  add column if not exists parsed_path text;

-- ---------------------------------------------------------------------------
-- Composite indexes for aggregate / filter queries
-- ---------------------------------------------------------------------------
create index if not exists spend_line_batch_plant_idx
  on public.spend_line (batch_id, plant_name);

create index if not exists spend_line_batch_expense_idx
  on public.spend_line (batch_id, expense_code);

create index if not exists spend_line_batch_payment_date_idx
  on public.spend_line (batch_id, payment_date);

-- ---------------------------------------------------------------------------
-- Aggregate RPCs (SECURITY INVOKER — RLS applies)
-- ---------------------------------------------------------------------------
create or replace function public.spend_agg_by_plant(
  p_batch_id uuid,
  p_top int default null
)
returns table (label text, amount numeric, count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  with grouped as (
    select
      plant_name as label,
      coalesce(sum(amount), 0) as amount,
      count(*)::bigint as count
    from public.spend_line
    where batch_id = p_batch_id
      and plant_name is not null
      and btrim(plant_name) <> ''
    group by plant_name
  ),
  ordered as (
    select * from grouped order by amount desc
  )
  select o.label, o.amount, o.count
  from ordered o
  limit case when p_top is null then null else greatest(p_top, 0) end;
$$;

create or replace function public.spend_agg_by_expense(
  p_batch_id uuid,
  p_top int default null
)
returns table (label text, amount numeric, count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  with grouped as (
    select
      expense_code as label,
      coalesce(sum(amount), 0) as amount,
      count(*)::bigint as count
    from public.spend_line
    where batch_id = p_batch_id
      and expense_code is not null
      and btrim(expense_code) <> ''
    group by expense_code
  ),
  ordered as (
    select * from grouped order by amount desc
  )
  select o.label, o.amount, o.count
  from ordered o
  limit case when p_top is null then null else greatest(p_top, 0) end;
$$;

create or replace function public.spend_agg_by_month(
  p_batch_id uuid
)
returns table (label text, amount numeric, count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    to_char(payment_date, 'YYYY-MM') as label,
    coalesce(sum(amount), 0) as amount,
    count(*)::bigint as count
  from public.spend_line
  where batch_id = p_batch_id
    and payment_date is not null
  group by to_char(payment_date, 'YYYY-MM')
  order by label asc;
$$;

create or replace function public.spend_lines_page(
  p_batch_id uuid,
  p_filter_kind text,
  p_filter_value text,
  p_limit int,
  p_offset int
)
returns table (
  id uuid,
  payment_date date,
  party_code text,
  party_name text,
  item_code text,
  item_name text,
  uom text,
  qty numeric,
  unit_price numeric,
  amount numeric,
  plant_name text,
  expense_code text,
  payment_method text,
  description text,
  invoice text,
  note text,
  total_count bigint,
  total_amount numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with filtered as (
    select s.*
    from public.spend_line s
    where s.batch_id = p_batch_id
      and (
        p_filter_kind is null
        or p_filter_kind = 'all'
        or (p_filter_kind = 'plant_name' and s.plant_name = p_filter_value)
        or (p_filter_kind = 'expense_code' and s.expense_code = p_filter_value)
        or (
          p_filter_kind = 'month'
          and s.payment_date is not null
          and to_char(s.payment_date, 'YYYY-MM') = p_filter_value
        )
      )
  ),
  counted as (
    select
      count(*)::bigint as total_count,
      coalesce(sum(amount), 0) as total_amount
    from filtered
  )
  select
    f.id,
    f.payment_date,
    f.party_code,
    f.party_name,
    f.item_code,
    f.item_name,
    f.uom,
    f.qty,
    f.unit_price,
    f.amount,
    f.plant_name,
    f.expense_code,
    f.payment_method,
    f.description,
    f.invoice,
    f.note,
    c.total_count,
    c.total_amount
  from filtered f
  cross join counted c
  order by f.payment_date asc nulls last, f.id asc
  limit greatest(coalesce(p_limit, 50), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.spend_agg_by_plant(uuid, int) from public;
revoke all on function public.spend_agg_by_expense(uuid, int) from public;
revoke all on function public.spend_agg_by_month(uuid) from public;
revoke all on function public.spend_lines_page(uuid, text, text, int, int) from public;

grant execute on function public.spend_agg_by_plant(uuid, int) to authenticated;
grant execute on function public.spend_agg_by_expense(uuid, int) to authenticated;
grant execute on function public.spend_agg_by_month(uuid) to authenticated;
grant execute on function public.spend_lines_page(uuid, text, text, int, int) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket + policies (path prefix = auth.uid())
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'spend-uploads',
  'spend-uploads',
  false,
  52428800,
  array[
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/octet-stream',
    'application/json'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "spend_uploads_select_own" on storage.objects;
drop policy if exists "spend_uploads_insert_own" on storage.objects;
drop policy if exists "spend_uploads_update_own" on storage.objects;
drop policy if exists "spend_uploads_delete_own" on storage.objects;

create policy "spend_uploads_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'spend-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "spend_uploads_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'spend-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "spend_uploads_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'spend-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'spend-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "spend_uploads_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'spend-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
