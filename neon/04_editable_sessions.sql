-- Enables two-phase charging session entry: a "quick start" row can be
-- created with only the fields known before charging begins (start time,
-- odometer before, battery % before, country, charging type, location,
-- provider, subscription plan), then completed/edited later once the
-- remaining fields (end time, kWh, battery % after, cost, currency, paid by)
-- are known. Run this once in the Neon SQL Editor, then click "Refresh
-- schema cache" on the Data API page afterwards (ALTER TABLE changes are not
-- picked up automatically — see neon/03_*.sql's note on this).

alter table public.charging_sessions
  alter column end_at drop not null,
  alter column kwh drop not null,
  alter column batt_after_pct drop not null,
  alter column cost drop not null,
  alter column currency drop not null,
  alter column paid_by drop not null;

-- The original "end_at > start_at" check implicitly required end_at to be
-- non-null; replace it with a version that allows end_at to still be unset.
alter table public.charging_sessions drop constraint if exists charging_sessions_end_at_check;
alter table public.charging_sessions
  add constraint charging_sessions_end_at_check check (end_at is null or end_at > start_at);

-- Editing/completing a session requires UPDATE, and the Records page's
-- delete button requires DELETE — both deliberately scoped to
-- charging_sessions only (other_expenses stays insert/select-only, since
-- expense entries are always entered complete in one go, matching the
-- "this applies only to charging-related records" requirement).
grant update, delete on public.charging_sessions to anonymous;

drop policy if exists "anon can update charging" on public.charging_sessions;
create policy "anon can update charging" on public.charging_sessions
  for update to anonymous using (true) with check (true);

drop policy if exists "anon can delete charging" on public.charging_sessions;
create policy "anon can delete charging" on public.charging_sessions
  for delete to anonymous using (true);
