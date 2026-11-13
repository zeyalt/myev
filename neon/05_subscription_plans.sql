-- myev Neon schema — part 5: user-managed subscription plans.
-- Run once in the Neon SQL Editor (after 01/02/04), then click "Refresh
-- schema cache" on the Data API page so the new table is exposed.
--
-- Powers Settings > Subscription Plans: the plan dropdown on the charging
-- form and the auto-calculated session cost (kwh / plan kWh * plan price).
-- charging_sessions.subscription_plan stays a plain text column that stores
-- the plan name, so deleting a plan here never touches historical sessions.

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (length(btrim(name)) > 0),
  kwh numeric(8,2) null check (kwh is null or kwh > 0),          -- prepaid bundle size
  price_sgd numeric(10,2) null check (price_sgd is null or price_sgd >= 0)  -- bundle price
);

create unique index if not exists uq_subscription_plans_name on public.subscription_plans (lower(name));

alter table public.subscription_plans enable row level security;

grant select, insert, update, delete on public.subscription_plans to anonymous;

drop policy if exists "anon can read plans" on public.subscription_plans;
create policy "anon can read plans" on public.subscription_plans for select to anonymous using (true);
drop policy if exists "anon can insert plans" on public.subscription_plans;
create policy "anon can insert plans" on public.subscription_plans for insert to anonymous with check (true);
drop policy if exists "anon can update plans" on public.subscription_plans;
create policy "anon can update plans" on public.subscription_plans for update to anonymous using (true) with check (true);
drop policy if exists "anon can delete plans" on public.subscription_plans;
create policy "anon can delete plans" on public.subscription_plans for delete to anonymous using (true);

-- Seed the plans previously hard-coded in the app. Only Regular 360kWh has a
-- known price; set the rest from Settings. Safe to re-run (unique name index).
insert into public.subscription_plans (name, kwh, price_sgd) values
  ('[Shell Recharge] Eurokars MG 500kWh', 500, null),
  ('[Charge+] Nano 55kWh', 55, null),
  ('[Charge+] Ultra-Lite 125kWh', 125, null),
  ('[Charge+] Lite 190kWh', 190, null),
  ('[Charge+] Regular 360kWh', 360, 193),
  ('[Charge+] Plus 480kWh', 480, null)
on conflict do nothing;
