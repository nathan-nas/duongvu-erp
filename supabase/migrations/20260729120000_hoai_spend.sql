-- supabase/migrations/20260729120000_hoai_spend.sql
create type public.batch_kind as enum ('annual', 'period', 'unknown');

create table public.import_batch (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_filename text not null,
  period_year int not null check (period_year between 2000 and 2100),
  batch_kind public.batch_kind not null default 'unknown',
  fact_rows int not null default 0,
  amount_sum numeric not null default 0,
  status text not null default 'ready' check (status in ('ready', 'failed')),
  created_at timestamptz not null default now()
);

create table public.spend_line (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.import_batch (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  payment_date date,
  payment_date_raw text,
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
  quality_flags jsonb not null default '[]'::jsonb
);

create index spend_line_batch_id_idx on public.spend_line (batch_id);
create index spend_line_user_id_idx on public.spend_line (user_id);
create index import_batch_user_id_idx on public.import_batch (user_id);

alter table public.import_batch enable row level security;
alter table public.spend_line enable row level security;

create policy "import_batch_owner_all"
  on public.import_batch for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "spend_line_owner_all"
  on public.spend_line for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
