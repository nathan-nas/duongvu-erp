create or replace function public.spend_line_batch_owned()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.import_batch b
    where b.id = new.batch_id
      and b.user_id = new.user_id
  ) then
    raise exception 'spend_line batch owner mismatch';
  end if;

  return new;
end;
$$;

create trigger spend_line_batch_owner_trg
before insert or update on public.spend_line
for each row
execute function public.spend_line_batch_owned();
