-- Adds Idle Start/End Date & Time fields (present in the original Google Form,
-- previously not captured) and normalizes the "ChargEV"/"chargEV" provider
-- name duplicate (official branding is lowercase-c "chargEV" per chargev.chargev.my).
-- Run this once in the Neon SQL Editor.

alter table public.charging_sessions
  add column if not exists idle_start_at timestamptz null,
  add column if not exists idle_end_at timestamptz null;

update public.charging_sessions
  set provider = 'chargEV'
  where provider = 'ChargEV';
