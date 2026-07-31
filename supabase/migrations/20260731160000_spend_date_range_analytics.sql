-- Analytics by transaction date range (payment_date), not import_batch.

-- Drop batch-scoped RPCs from earlier migrations
drop function if exists public.spend_agg_by_plant(uuid, int);
drop function if exists public.spend_agg_by_expense(uuid, int);
drop function if exists public.spend_agg_by_month(uuid);
drop function if exists public.spend_lines_page(uuid, text, text, int, int);
drop function if exists public.spend_batch_date_bounds();

create index if not exists spend_line_user_payment_date_idx
  on public.spend_line (user_id, payment_date);

-- ---------------------------------------------------------------------------
-- Bounds for default date range
-- ---------------------------------------------------------------------------
create or replace function public.spend_date_bounds()
returns table (
  min_payment_date date,
  max_payment_date date
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    min(s.payment_date) as min_payment_date,
    max(s.payment_date) as max_payment_date
  from public.spend_line s
  where s.payment_date is not null;
$$;

create or replace function public.spend_range_totals(
  p_from date,
  p_to date
)
returns table (
  amount_sum numeric,
  fact_rows bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(sum(s.amount), 0) as amount_sum,
    count(*)::bigint as fact_rows
  from public.spend_line s
  where s.payment_date is not null
    and s.payment_date between p_from and p_to;
$$;

create or replace function public.spend_agg_by_plant(
  p_from date,
  p_to date,
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
    where payment_date is not null
      and payment_date between p_from and p_to
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
  p_from date,
  p_to date,
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
    where payment_date is not null
      and payment_date between p_from and p_to
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
  p_from date,
  p_to date
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
  where payment_date is not null
    and payment_date between p_from and p_to
  group by to_char(payment_date, 'YYYY-MM')
  order by label asc;
$$;

create or replace function public.spend_lines_page(
  p_from date,
  p_to date,
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
    where s.payment_date is not null
      and s.payment_date between p_from and p_to
      and (
        p_filter_kind is null
        or p_filter_kind = 'all'
        or (p_filter_kind = 'plant_name' and s.plant_name = p_filter_value)
        or (p_filter_kind = 'expense_code' and s.expense_code = p_filter_value)
        or (
          p_filter_kind = 'month'
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

revoke all on function public.spend_date_bounds() from public;
revoke all on function public.spend_range_totals(date, date) from public;
revoke all on function public.spend_agg_by_plant(date, date, int) from public;
revoke all on function public.spend_agg_by_expense(date, date, int) from public;
revoke all on function public.spend_agg_by_month(date, date) from public;
revoke all on function public.spend_lines_page(date, date, text, text, int, int) from public;

grant execute on function public.spend_date_bounds() to authenticated;
grant execute on function public.spend_range_totals(date, date) to authenticated;
grant execute on function public.spend_agg_by_plant(date, date, int) to authenticated;
grant execute on function public.spend_agg_by_expense(date, date, int) to authenticated;
grant execute on function public.spend_agg_by_month(date, date) to authenticated;
grant execute on function public.spend_lines_page(date, date, text, text, int, int) to authenticated;
