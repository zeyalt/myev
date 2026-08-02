# CLAUDE.md

## Project Overview
myev is a React + Vite + Tailwind PWA for EV charging analytics & expense
tracking. It replaces ev-insights-bot (Telegram bot + Google Sheet + static HTML
dashboard) with: an in-app two-branch data entry form, Neon Postgres storage (via
Neon's Data API), and a from-scratch dashboard + Insights tab. No login/auth (open
app), matching the original dashboard's design. No Telegram bot or any messaging
integration exists in this project — the old bot's `build_insights()`/
`cmd_alltime()` logic was used only as a reference when porting the Insights tab's
calculations into TypeScript.

## Data Layer: Neon, not Supabase
- **Storage is Neon Postgres**, accessed from the browser via **Neon's Data API**
  (PostgREST-compatible REST over a Neon branch) + **Neon Auth** ("Managed Better
  Auth" — both beta as of this writing). Chosen over Supabase specifically because
  Supabase's free tier caps you at 2 projects; Neon's free tier allows up to 100.
- **Anonymous access still requires a JWT.** Neon's Data API does NOT support
  fully headerless/unauthenticated requests the way Supabase's static anon key
  does — even the `anonymous` Postgres role needs a short-lived JWT attached as a
  Bearer token, or every request 400s with "missing authentication credentials".
  Getting that JWT requires Neon Auth to be enabled on the branch (it wasn't,
  initially — the Data API was first enabled with "Use Neon Auth" unchecked, which
  only provisions the bare `anonymous` role with no way to authenticate as it; Neon
  Auth had to be added afterwards via the Data API page's "Configure Neon Auth" →
  "Enable Neon Auth" button).
- `src/lib/dataApiClient.ts` uses `@neondatabase/neon-js`'s `createClient()` with
  `auth: { url: VITE_NEON_AUTH_URL, allowAnonymous: true }` and
  `dataApi: { url: VITE_NEON_DATA_API_URL }`. `allowAnonymous: true` makes the
  client fetch and cache a short-lived anonymous JWT on first request and attach it
  automatically to every query — no sign-in UI, no login screen, matches the
  no-auth app design. The resulting `db.from().select()/.insert()` API is
  `@supabase/postgrest-js` itself under the hood (`NeonPostgrestClient extends
  PostgrestClient`), confirmed by reading the package's shipped `.d.mts` files —
  so query-builder usage is identical to Supabase's, only the client construction
  differs.
- `charging_sessions` and `other_expenses` tables live in a Neon branch, created by
  `neon/01_tables.sql`.
- Raw cost fields (`cost`, `rebate`, `idle_fees`) are stored in their original
  `currency` (SGD or MYR) — NOT pre-converted. SGD conversion happens by multiplying
  by the row's own `fx_rate_to_sgd` (see below), in `src/lib/derive.ts` at read time.
- RLS + GRANTs on the Postgres `anonymous` role (provisioned by enabling the Data
  API, NOT created manually — see Setup below) gate access: INSERT and SELECT only
  on both tables — no UPDATE/DELETE policies exist, bounding worst-case abuse of a
  leaked/guessed endpoint. `neon/02_grants.sql` applies these after the role exists.
- **Known supply-chain risk**: `npm audit` flags a critical vulnerability chain in
  `better-auth` (pulled in transitively via `@neondatabase/auth`) covering
  OAuth/OIDC/admin/magic-link account-takeover issues, with no non-breaking fix
  available yet (pinned deep in this beta package's own tree). myev's usage
  (`allowAnonymous` only, no sign-in/OAuth/admin flows) doesn't exercise the
  vulnerable code paths, but **do not add any real login/OAuth feature to this app
  until this is resolved upstream** — re-run `npm audit --omit=dev` before doing so.
- **Beta caveat**: both the Data API and Neon Auth were in beta when this was
  built, with docs that were sometimes incomplete or inconsistent — the setup steps
  below were verified empirically (reading the installed package's `.d.mts` files,
  live-testing against the real endpoints) rather than trusted from docs alone. If
  either proves too unstable/limited in practice, the documented fallback is a thin
  serverless backend (Vercel/Netlify function or small Express server) holding a
  direct `DATABASE_URL` + Prisma, mirroring the pattern bloom (`../bloom`) already
  uses — this would replace `dataApiClient.ts`'s direct browser-to-Neon calls with
  calls to that backend, without touching `derive.ts`, the hooks' shapes, or any UI
  component.

## Business Rules (DO NOT CHANGE without explicit user request)
- **MYR→SGD conversion uses the actual historical FX rate for the session's start
  date** — NOT a fixed rate, NOT the live/current-day rate. Resolved once at
  entry-form submission time via `src/lib/fx.ts` (`getHistoricalFxRate`), which
  calls the free [Frankfurter](https://www.frankfurter.app/) API for the
  `Charging Start Date`, and is stored per-row as `fx_rate_to_sgd` +
  `fx_rate_source` (`'api' | 'cached_fallback' | 'fixed_fallback'`). Fallback chain
  on API failure: last successfully-fetched rate cached in localStorage, else a
  fixed `1/3.14` as a last resort. `derive.ts` just multiplies by the row's stored
  rate at read time — no network calls happen on read.
- `cost_per_kwh` is ALWAYS `gross_cost / kwh` (never net cost). Displayed at 4
  decimal places everywhere it appears (KPI tile, tables, Insights tab).
- `net_cost = gross_cost - rebate`.
- Energy consumption (kWh/100km, %/100km) is derived from CONSECUTIVE sessions
  (sorted by start time ascending): uses the battery drop between session i's end
  and session i+1's start, and the odometer distance driven in between. See
  `src/lib/derive.ts` (`deriveSessions`) for the exact formula and
  `src/lib/derive.test.ts` for worked examples — this is the highest-risk-of-drift
  calculation in the app, keep it covered by tests.
- The main dashboard's Energy Consumption chart shows RAW (unfiltered) per-session
  values. The Insights tab's narrative "avg energy consumption" figure uses
  IQR-outlier-filtering (`computeEnergyConsumptionIQR` in `derive.ts`, ported from
  the old bot's `compute_energy_consumption()`) — this split is intentional, do not
  unify without discussion.
- Distance per session = `max(0, odometer_this - odometer_previous)`; first
  session's distance = 0.
- "Expenses by Category" donut combines a synthesized `EV Charging` category
  (`sum(net_cost + idle_fees)` across sessions) with each Other-Expenses category
  (`sum(amount)`). This differs from the KPI `Gross Charging Spend`, which uses
  gross (not net) cost — the two numbers are intentionally different views.
- KPI `Total Spend` = `sum(net_cost) + sum(idle_fees) + sum(other expense amounts)`.
- Field naming: use `paid_by` consistently for both branches (the reference Google
  Sheet had "Payment By" on charging rows and "Paid By" on expense rows —
  normalized here to a single name).
- Expense Category is a fixed dropdown (`EXPENSE_CATEGORIES` in
  `src/lib/constants.ts`): Cardcard Auto Top-up, Parking.sg, Maintenance, Monthly
  Mortgage, Car Wash, Road Tax, Insurance, Other (free-text revealed when "Other"
  is selected). "EV Charging" is NOT one of these — it's the other branch entirely
  (`charging_sessions` table), only synthesized as a category label in the
  Expenses-by-Category donut.
- Battery % After Charging < Battery % Before Charging is a HARD-BLOCKED validation
  error on the entry form (zod `.refine()` in `ChargingEntryForm.tsx`) — not a
  soft warning.
- Charging Location / Provider / Paid By / Payment Method are free-text fields with
  datalist autocomplete sourced from Neon distinct-value queries
  (`useDistinctValues` hook) — not managed lookup tables. Matches the source
  Google Sheet's denormalized approach.

## Architecture
- `src/lib/dataApiClient.ts`: the `db` client (`@neondatabase/neon-js`, anonymous
  JWT via Neon Auth, pointed at Neon's Data API) — all Neon reads/writes go
  through this.
- `src/lib/derive.ts`: pure functions transforming raw DB rows into derived
  fields (gross/net cost, cost_per_kwh, duration, speed, battery rate, distance,
  energy consumption). All UI components consume derived data, never raw rows.
- `src/lib/aggregate.ts`: shared aggregation helpers (period totals, category
  totals, provider totals, group-by-month) used by both the dashboard KPIs and the
  Insights tab, so the two never silently diverge.
- `src/lib/insights.ts`: ports the old bot's `/insights`/`/alltime` text-summary
  logic into structured data for the Insights tab UI.
- `src/lib/fx.ts`: historical FX rate lookup + fallback chain (see Business Rules).
- `src/hooks/`: React Query hooks fetch+cache Neon Data API data; derive on read.
- `src/store/filterStore.ts`: Zustand store for dashboard filters + cross-filter
  state (donut click → filters all other charts), mirroring the old dashboard's
  global `crossFilterProvider` pattern.
- `src/components/charts/`: react-chartjs-2 wrappers; `chartTheme.ts` holds shared
  Chart.js config (tooltip/legend/animation/center-text/threshold-line plugins)
  ported from the old `dashboard.html`.

## PWA / Offline
- App shell precached (installable, opens offline).
- Neon Data API responses cached via NetworkFirst strategy (`vite-plugin-pwa`);
  offline shows last-fetched data with a staleness banner (`OfflineBanner.tsx`).
  Writes (entry form) require connectivity in v1 — no offline write queue.

## Reference
Original project (read-only reference for parity checks, do not modify):
`../ev-insights-bot/bot/app.py` and `../ev-insights-bot/bot/dashboard.html`.
For the fallback backend pattern if Neon's Data API needs to be replaced: `../bloom`
(Next.js + Prisma + Neon via `DATABASE_URL`, not the Data API).

## Setup (for a fresh clone)
Order matters and is unintuitive because of how Neon provisions the `anonymous`
role — follow this exact sequence:

1. Create a Neon project (or a new database/branch in an existing one — Neon's free
   tier allows many projects, unlike Supabase's 2-project cap).
2. Run `neon/01_tables.sql` against it (Neon Console SQL editor, or
   `psql $DATABASE_URL -f neon/01_tables.sql`). This only creates the tables/indexes
   and turns on RLS — no roles yet. Do NOT create an `anonymous` role yourself here;
   see step 3.
3. In the Neon Console, go to the branch's **Data API** page, **uncheck both** "Use
   Neon Auth" and "Grant public schema access", then click **Enable Data API**. This
   provisions the bare `anonymous` role and gives you the **Data API URL**
   (`https://<endpoint>.apirest.<region>.aws.neon.tech/<db>/rest/v1`) — copy it.
   (At this point requests will still fail auth — that's expected, continue to step 4.)
4. Still on the Data API page, find the **"Configure Neon Auth"** card and click its
   **"Neon Auth"** button, then **"Enable Neon Auth"** on the screen that follows.
   This is required even though the app has no login UI — Neon's Data API demands a
   JWT for every request, including anonymous ones, and Neon Auth ("Managed Better
   Auth") is what issues that JWT. Once enabled, go to its **Configuration** tab and
   copy the **Auth URL** (`https://<endpoint>.neonauth.<region>.aws.neon.tech/<db>/auth`).
5. Run `neon/02_grants.sql` — grants the `anonymous` role (now provisioned by step 3)
   select/insert on both tables and creates its RLS policies.
6. `cp .env.example .env.local` and set `VITE_NEON_DATA_API_URL` (from step 3) and
   `VITE_NEON_AUTH_URL` (from step 4).
7. `npm install && npm run dev`. Verify with Playwright/DevTools that `/`, `/add`,
   and `/insights` load with no console errors, and that submitting a test entry on
   `/add` shows "Saved." and appears on the Dashboard — this confirms the anonymous
   JWT flow is actually working end-to-end, not just that the URLs are reachable.
