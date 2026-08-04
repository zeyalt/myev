-- myev Neon schema — part 2: grants + RLS policies for the "anonymous" role
-- Run this AFTER enabling the Data API on the branch (Neon Console > Data
-- API > enable with "Use Neon Auth" unchecked — that step creates the
-- "anonymous" role this script grants access to; running this first will
-- fail with "role anonymous does not exist").

grant usage on schema public to anonymous;
grant select, insert on public.charging_sessions, public.other_expenses to anonymous;
-- UPDATE and DELETE are scoped to charging_sessions only: charging entries
-- are created in two phases (quick-start, then completed/edited later once
-- the session ends) and support a delete button on the Records page.
-- other_expenses entries are always entered complete in one go and stay
-- insert/select-only.
grant update, delete on public.charging_sessions to anonymous;
grant usage, select on all sequences in schema public to anonymous;

drop policy if exists "anon can read charging" on public.charging_sessions;
create policy "anon can read charging" on public.charging_sessions
  for select to anonymous using (true);

drop policy if exists "anon can insert charging" on public.charging_sessions;
create policy "anon can insert charging" on public.charging_sessions
  for insert to anonymous with check (true);

drop policy if exists "anon can update charging" on public.charging_sessions;
create policy "anon can update charging" on public.charging_sessions
  for update to anonymous using (true) with check (true);

drop policy if exists "anon can delete charging" on public.charging_sessions;
create policy "anon can delete charging" on public.charging_sessions
  for delete to anonymous using (true);

drop policy if exists "anon can read expenses" on public.other_expenses;
create policy "anon can read expenses" on public.other_expenses
  for select to anonymous using (true);

drop policy if exists "anon can insert expenses" on public.other_expenses;
create policy "anon can insert expenses" on public.other_expenses
  for insert to anonymous with check (true);

-- No update/delete GRANTs or policies on other_expenses: bounds the worst
-- case of a leaked/guessed endpoint on expense data to spam-inserts, never
-- edits or data loss. charging_sessions now allows update+delete (above) so
-- sessions can be completed/edited and mistaken entries removed.
