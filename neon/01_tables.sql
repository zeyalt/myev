-- myev Neon schema — part 1: tables
-- Run this FIRST, against a fresh Neon project's default branch (SQL Editor
-- in the Neon Console, or `psql $DATABASE_URL -f neon/01_tables.sql`),
-- BEFORE enabling the Data API on that branch.
--
-- Do NOT create an "anonymous" role yourself: when you enable the Data API
-- in the Neon Console (with "Use Neon Auth" unchecked), Neon provisions its
-- own "anonymous" role automatically. Creating one in advance causes
-- "Request failed: anonymous role already exists" when enabling the Data
-- API. Grants/policies for that role are applied afterwards, in
-- neon/02_grants.sql.

create table if not exists public.charging_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  start_at timestamptz not null,
  end_at timestamptz not null check (end_at > start_at),
  kwh numeric(8,3) not null check (kwh >= 0),
  odometer_km numeric(9,1) not null check (odometer_km >= 0),
  batt_before_pct numeric(5,1) not null check (batt_before_pct between 0 and 100),
  batt_after_pct numeric(5,1) not null check (batt_after_pct between 0 and 100),
  cost numeric(10,2) not null default 0,
  rebate numeric(10,2) not null default 0,
  idle_fees numeric(10,2) not null default 0,
  currency text not null check (currency in ('SGD','MYR')),
  fx_rate_to_sgd numeric(10,6) not null default 1,
  fx_rate_source text not null default 'api' check (fx_rate_source in ('api','cached_fallback','fixed_fallback')),
  country text not null check (country in ('Singapore','Malaysia')),
  charging_type text not null check (charging_type in ('AC','DC')),
  location text not null,
  provider text not null,
  subscription_plan text not null default 'None',
  paid_by text not null
);

create index if not exists idx_charging_start_at on public.charging_sessions (start_at);
create index if not exists idx_charging_provider on public.charging_sessions (provider);
create index if not exists idx_charging_location on public.charging_sessions (location);

create table if not exists public.other_expenses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  expense_date date not null,
  category text not null,
  amount_sgd numeric(10,2) not null check (amount_sgd >= 0),
  payment_method text not null,
  paid_by text not null
);

create index if not exists idx_expenses_date on public.other_expenses (expense_date);
create index if not exists idx_expenses_category on public.other_expenses (category);

alter table public.charging_sessions enable row level security;
alter table public.other_expenses enable row level security;
