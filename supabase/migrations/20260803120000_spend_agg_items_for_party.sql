-- Item aggregates scoped to a party label + optional item filter on spend_lines_page.

create or replace function public.spend_agg_items_for_party(
  p_from date,
  p_to date,
  p_party_label text
)
returns table (label text, amount numeric, count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    (
      coalesce(nullif(btrim(s.item_code), ''), '—')
      || ' — '
      || coalesce(nullif(btrim(s.item_name), ''), '—')
    ) as label,
    coalesce(sum(s.amount), 0) as amount,
    count(*)::bigint as count
  from public.spend_line s
  where s.payment_date is not null
    and s.payment_date between p_from and p_to
    and (
      coalesce(nullif(btrim(s.party_code), ''), '—')
      || ' — '
      || coalesce(nullif(btrim(s.party_name), ''), '—')
    ) = p_party_label
    and (
      (s.item_code is not null and btrim(s.item_code) <> '')
      or (s.item_name is not null and btrim(s.item_name) <> '')
    )
  group by 1
  order by amount desc;
$$;

drop function if exists public.spend_lines_page(date, date, text, text, int, int);

create or replace function public.spend_lines_page(
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
      s.id, s.payment_date, s.party_code, s.party_name, s.item_code, s.item_name,
      s.uom, s.qty, s.unit_price, s.amount, s.plant_name, s.expense_code,
      s.payment_method, s.description, s.invoice, s.note,
      t.total_count, t.total_amount
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
      s.id, s.payment_date, s.party_code, s.party_name, s.item_code, s.item_name,
      s.uom, s.qty, s.unit_price, s.amount, s.plant_name, s.expense_code,
      s.payment_method, s.description, s.invoice, s.note,
      t.total_count, t.total_amount
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
      s.id, s.payment_date, s.party_code, s.party_name, s.item_code, s.item_name,
      s.uom, s.qty, s.unit_price, s.amount, s.plant_name, s.expense_code,
      s.payment_method, s.description, s.invoice, s.note,
      t.total_count, t.total_amount
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
      s.id, s.payment_date, s.party_code, s.party_name, s.item_code, s.item_name,
      s.uom, s.qty, s.unit_price, s.amount, s.plant_name, s.expense_code,
      s.payment_method, s.description, s.invoice, s.note,
      t.total_count, t.total_amount
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
          or (
            coalesce(nullif(btrim(s.item_code), ''), '—')
            || ' — '
            || coalesce(nullif(btrim(s.item_name), ''), '—')
          ) = v_item
        )
    )
    select
      s.id, s.payment_date, s.party_code, s.party_name, s.item_code, s.item_name,
      s.uom, s.qty, s.unit_price, s.amount, s.plant_name, s.expense_code,
      s.payment_method, s.description, s.invoice, s.note,
      t.total_count, t.total_amount
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
        or (
          coalesce(nullif(btrim(s.item_code), ''), '—')
          || ' — '
          || coalesce(nullif(btrim(s.item_name), ''), '—')
        ) = v_item
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
      s.id, s.payment_date, s.party_code, s.party_name, s.item_code, s.item_name,
      s.uom, s.qty, s.unit_price, s.amount, s.plant_name, s.expense_code,
      s.payment_method, s.description, s.invoice, s.note,
      t.total_count, t.total_amount
    from public.spend_line s
    cross join totals t
    where s.payment_date is not null
      and s.payment_date between p_from and p_to
    order by s.payment_date asc nulls last, s.id asc
    limit v_limit offset v_offset;
  end if;
end;
$$;

revoke all on function public.spend_agg_items_for_party(date, date, text) from public;
grant execute on function public.spend_agg_items_for_party(date, date, text) to authenticated;

revoke all on function public.spend_lines_page(date, date, text, text, int, int, text) from public;
grant execute on function public.spend_lines_page(date, date, text, text, int, int, text) to authenticated;
