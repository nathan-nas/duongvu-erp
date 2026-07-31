-- Date bounds per batch for analytics selector labels (from payment_date / ngày).

create or replace function public.spend_batch_date_bounds()
returns table (
  batch_id uuid,
  min_payment_date date,
  max_payment_date date
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    s.batch_id,
    min(s.payment_date) as min_payment_date,
    max(s.payment_date) as max_payment_date
  from public.spend_line s
  where s.payment_date is not null
  group by s.batch_id;
$$;

revoke all on function public.spend_batch_date_bounds() from public;
grant execute on function public.spend_batch_date_bounds() to authenticated;
