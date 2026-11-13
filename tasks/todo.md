# Records tab + entry form improvements

- [x] 1. Records page: top-level tabs (Charging-Related | Other Expenses); "+ Add Entry" and the table follow the active tab; EntryForm takes `branch` prop (no internal toggle)
- [x] 2. Charging table: remove FX Rate + FX Source columns (data still stored)
- [x] 3. Subscription cost auto-calc: `src/lib/subscription.ts` (plan kWh parsed from name, price map) -> cost = kwh / planKwh * price, only while Cost field untouched, SGD only; with tests
- [x] 4. Auto-select subscription plan from most recent past session at same location+provider (fallback: provider only); create mode only, only if plan untouched
- [x] 5. Idle fields grouped in one section behind an off-by-default toggle; off => idle_start/end null, idle_fees 0
- [x] 6. Verify: vitest, tsc, oxlint, build, browser smoke test; update CLAUDE.md

## Open question
- Plan prices: only Charge+ Regular 360kWh = $193 known. Others left `null` (no auto-calc) until user supplies them.

## Review
- 19/19 tests, tsc + oxlint clean; Playwright smoke test (read-only, nothing submitted): tabs, FX cols gone, plan auto-select (Waterbay Condo + Charge+ -> Regular 360kWh), 50kWh -> 26.81, manual cost override preserved, idle toggle, tab switch closes form.
- Bug caught in verification: object effect-dep -> infinite render loop; fixed by depending on the primitive.
- Not committed (awaiting explicit yes).

# Settings: manage subscription plans (Neon table)
- [x] A. neon/05_subscription_plans.sql (table, unique lower(name), grants+RLS, seed of current plans, Regular 360 = $193)
- [x] B. lib/subscription.ts takes plan list (name, kwh, price); fallback to built-in defaults if table missing; remove SUBSCRIPTION_PLANS const
- [x] C. useSubscriptionPlans hook; form dropdown + cost calc + plan inference read from it
- [x] D. /settings page + nav item: add / edit (name, kWh, price) / delete; rename cascades to past sessions
- [x] E. tests (validation, cost), tsc/lint/build, browser smoke (read-only), CLAUDE.md

## Review (settings)
- 22/22 tests, tsc/oxlint clean. Playwright with mocked plans API (live DB untouched, session writes intercepted): error+fallback when table missing, list/edit/add/delete, reserved-name validation, rename cascade request, edited price drives form cost.
- **neon/05 NOT yet run on the live DB** — user must run it + refresh schema cache.
- Not committed (awaiting explicit yes).
