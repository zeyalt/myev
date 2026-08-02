-- myev Neon schema — part 2: grants + RLS policies for the "anonymous" role
-- Run this AFTER enabling the Data API on the branch (Neon Console > Data
-- API > enable with "Use Neon Auth" unchecked — that step creates the
-- "anonymous" role this script grants access to; running this first will
-- fail with "role anonymous does not exist").

grant usage on schema public to anonymous;
grant select, insert on public.charging_sessions, public.other_expenses to anonymous;
grant usage, select on all sequences in schema public to anonymous;

drop policy if exists "anon can read charging" on public.charging_sessions;
create policy "anon can read charging" on public.charging_sessions
  for select to anonymous using (true);

drop policy if exists "anon can insert charging" on public.charging_sessions;
create policy "anon can insert charging" on public.charging_sessions
  for insert to anonymous with check (true);

drop policy if exists "anon can read expenses" on public.other_expenses;
create policy "anon can read expenses" on public.other_expenses
  for select to anonymous using (true);

drop policy if exists "anon can insert expenses" on public.other_expenses;
create policy "anon can insert expenses" on public.other_expenses
  for insert to anonymous with check (true);

-- No update/delete GRANTs or policies: the anonymous role can only ever
-- insert or select, bounding the worst case of a leaked/guessed endpoint to
-- spam-inserts / reading all rows, never data destruction.
