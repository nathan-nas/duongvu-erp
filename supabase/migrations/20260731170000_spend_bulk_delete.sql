-- Bulk delete RPCs (Phase 1 data management)

create or replace function public.spend_delete_preview(p_from date, p_to date)
returns table (
  row_count bigint,
  amount_sum numeric,
  batch_count_touched bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    count(*)::bigint as row_count,
    coalesce(sum(amount), 0) as amount_sum,
    count(distinct batch_id)::bigint as batch_count_touched
  from public.spend_line
  where payment_date between p_from and p_to;
$$;

create or replace function public.spend_delete_by_date_range(
  p_from date,
  p_to date,
  p_limit int
)
returns bigint
language plpgsql
security invoker
set search_path = public
as $$
declare
  deleted bigint;
begin
  with victims as (
    select id
    from public.spend_line
    where payment_date between p_from and p_to
    order by id
    limit greatest(coalesce(p_limit, 400), 1)
  )
  delete from public.spend_line s
  using victims v
  where s.id = v.id;

  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

create or replace function public.spend_prune_empty_batches()
returns table (
  id uuid,
  storage_path text,
  parsed_path text
)
language sql
security invoker
set search_path = public
as $$
  delete from public.import_batch b
  where not exists (
    select 1 from public.spend_line s where s.batch_id = b.id
  )
  returning b.id, b.storage_path, b.parsed_path;
$$;

revoke all on function public.spend_delete_preview(date, date) from public;
revoke all on function public.spend_delete_by_date_range(date, date, int) from public;
revoke all on function public.spend_prune_empty_batches() from public;

grant execute on function public.spend_delete_preview(date, date) to authenticated;
grant execute on function public.spend_delete_by_date_range(date, date, int) to authenticated;
grant execute on function public.spend_prune_empty_batches() to authenticated;
