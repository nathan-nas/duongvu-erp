-- Recalc import_batch aggregates after spend_line CRUD

create or replace function public.spend_recalc_batch_stats(p_batch_id uuid)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.import_batch b
  set
    fact_rows = coalesce((
      select count(*)::int from public.spend_line s where s.batch_id = p_batch_id
    ), 0),
    amount_sum = coalesce((
      select sum(s.amount) from public.spend_line s where s.batch_id = p_batch_id
    ), 0)
  where b.id = p_batch_id;
$$;

revoke all on function public.spend_recalc_batch_stats(uuid) from public;
grant execute on function public.spend_recalc_batch_stats(uuid) to authenticated;
