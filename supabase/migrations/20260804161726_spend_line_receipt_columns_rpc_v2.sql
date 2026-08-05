-- Preserve Excel columns N (NGƯỜI NHẬN) and O (PHIẾU NGÀY) on spend lines.
-- This migration intentionally follows the party/item analytics migrations so
-- the final paged RPC keeps their seven-argument contract.

alter table public.spend_line
  add column if not exists received_date date,
  add column if not exists received_date_raw text,
  add column if not exists recipient_name text;

-- Remove both historical overloads. PostgreSQL cannot change RETURNS TABLE via
-- create or replace, and PostgREST should expose only one unambiguous contract.
drop function if exists public.spend_lines_page(date, date, text, text, int, int);
drop function if exists public.spend_lines_page(date, date, text, text, int, int, text);

create function public.spend_lines_page(
  p_from date,
  p_to date,
  p_filter_kind text,
  p_filter_value text,
  p_limit int,
  p_offset int,
  p_item_label text default null
)
returns table (
  id uuid,
  payment_date date,
  received_date date,
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
  recipient_name text,
  total_count bigint,
  total_amount numeric
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_limit int := greatest(coalesce(p_limit, 400), 1);
  v_offset int := greatest(coalesce(p_offset, 0), 0);
  v_kind text := coalesce(p_filter_kind, 'all');
  v_item text := nullif(btrim(coalesce(p_item_label, '')), '');
begin
  if v_kind = 'all' then
    return query
    with totals as (
      select
        count(*)::bigint as total_count,
        coalesce(sum(s.amount), 0) as total_amount
      from public.spend_line s
      where s.payment_date is not null
        and s.payment_date between p_from and p_to
    )
    select
      s.id, s.payment_date, s.received_date, s.party_code, s.party_name,
      s.item_code, s.item_name, s.uom, s.qty, s.unit_price, s.amount,
      s.plant_name, s.expense_code, s.payment_method, s.description,
      s.invoice, s.note, s.recipient_name, t.total_count, t.total_amount
    from public.spend_line s
    cross join totals t
    where s.payment_date is not null
      and s.payment_date between p_from and p_to
    order by s.payment_date asc nulls last, s.id asc
    limit v_limit offset v_offset;

  elsif v_kind = 'plant_name' then
    return query
    with totals as (
      select
        count(*)::bigint as total_count,
        coalesce(sum(s.amount), 0) as total_amount
      from public.spend_line s
      where s.payment_date is not null
        and s.payment_date between p_from and p_to
        and s.plant_name = p_filter_value
    )
    select
      s.id, s.payment_date, s.received_date, s.party_code, s.party_name,
      s.item_code, s.item_name, s.uom, s.qty, s.unit_price, s.amount,
      s.plant_name, s.expense_code, s.payment_method, s.description,
      s.invoice, s.note, s.recipient_name, t.total_count, t.total_amount
    from public.spend_line s
    cross join totals t
    where s.payment_date is not null
      and s.payment_date between p_from and p_to
      and s.plant_name = p_filter_value
    order by s.payment_date asc nulls last, s.id asc
    limit v_limit offset v_offset;

  elsif v_kind = 'expense_code' then
    return query
    with totals as (
      select
        count(*)::bigint as total_count,
        coalesce(sum(s.amount), 0) as total_amount
      from public.spend_line s
      where s.payment_date is not null
        and s.payment_date between p_from and p_to
        and s.expense_code = p_filter_value
    )
    select
      s.id, s.payment_date, s.received_date, s.party_code, s.party_name,
      s.item_code, s.item_name, s.uom, s.qty, s.unit_price, s.amount,
      s.plant_name, s.expense_code, s.payment_method, s.description,
      s.invoice, s.note, s.recipient_name, t.total_count, t.total_amount
    from public.spend_line s
    cross join totals t
    where s.payment_date is not null
      and s.payment_date between p_from and p_to
      and s.expense_code = p_filter_value
    order by s.payment_date asc nulls last, s.id asc
    limit v_limit offset v_offset;

  elsif v_kind = 'month' then
    return query
    with totals as (
      select
        count(*)::bigint as total_count,
        coalesce(sum(s.amount), 0) as total_amount
      from public.spend_line s
      where s.payment_date is not null
        and s.payment_date between p_from and p_to
        and to_char(s.payment_date, 'YYYY-MM') = p_filter_value
    )
    select
      s.id, s.payment_date, s.received_date, s.party_code, s.party_name,
      s.item_code, s.item_name, s.uom, s.qty, s.unit_price, s.amount,
      s.plant_name, s.expense_code, s.payment_method, s.description,
      s.invoice, s.note, s.recipient_name, t.total_count, t.total_amount
    from public.spend_line s
    cross join totals t
    where s.payment_date is not null
      and s.payment_date between p_from and p_to
      and to_char(s.payment_date, 'YYYY-MM') = p_filter_value
    order by s.payment_date asc nulls last, s.id asc
    limit v_limit offset v_offset;

  elsif v_kind = 'party' then
    return query
    with totals as (
      select
        count(*)::bigint as total_count,
        coalesce(sum(s.amount), 0) as total_amount
      from public.spend_line s
      where s.payment_date is not null
        and s.payment_date between p_from and p_to
        and (
          coalesce(nullif(btrim(s.party_code), ''), '—')
          || ' — '
          || coalesce(nullif(btrim(s.party_name), ''), '—')
        ) = p_filter_value
        and (
          v_item is null
          or public.spend_item_label(s.item_code, s.item_name) = v_item
        )
    )
    select
      s.id, s.payment_date, s.received_date, s.party_code, s.party_name,
      s.item_code, s.item_name, s.uom, s.qty, s.unit_price, s.amount,
      s.plant_name, s.expense_code, s.payment_method, s.description,
      s.invoice, s.note, s.recipient_name, t.total_count, t.total_amount
    from public.spend_line s
    cross join totals t
    where s.payment_date is not null
      and s.payment_date between p_from and p_to
      and (
        coalesce(nullif(btrim(s.party_code), ''), '—')
        || ' — '
        || coalesce(nullif(btrim(s.party_name), ''), '—')
      ) = p_filter_value
      and (
        v_item is null
        or public.spend_item_label(s.item_code, s.item_name) = v_item
      )
    order by s.payment_date asc nulls last, s.id asc
    limit v_limit offset v_offset;

  else
    return query
    with totals as (
      select
        count(*)::bigint as total_count,
        coalesce(sum(s.amount), 0) as total_amount
      from public.spend_line s
      where s.payment_date is not null
        and s.payment_date between p_from and p_to
    )
    select
      s.id, s.payment_date, s.received_date, s.party_code, s.party_name,
      s.item_code, s.item_name, s.uom, s.qty, s.unit_price, s.amount,
      s.plant_name, s.expense_code, s.payment_method, s.description,
      s.invoice, s.note, s.recipient_name, t.total_count, t.total_amount
    from public.spend_line s
    cross join totals t
    where s.payment_date is not null
      and s.payment_date between p_from and p_to
    order by s.payment_date asc nulls last, s.id asc
    limit v_limit offset v_offset;
  end if;
end;
$$;

revoke all on function public.spend_lines_page(date, date, text, text, int, int, text) from public;
grant execute on function public.spend_lines_page(date, date, text, text, int, int, text) to authenticated;
