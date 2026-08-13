-- Per-user table column preferences (order, visibility, widths)
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
