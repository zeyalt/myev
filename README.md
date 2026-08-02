# myev

A futuristic, installable PWA for EV charging analytics & expense tracking. Replaces
[ev-insights-bot](../ev-insights-bot)'s Telegram bot + Google Sheet + static dashboard
with an in-app data entry form, Neon Postgres storage, and a from-scratch dashboard +
Insights tab. No login required.

See [CLAUDE.md](./CLAUDE.md) for full architecture notes, business rules, and setup
steps for the Neon backend (Data API + Neon Auth).

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in your Neon Data API + Auth URLs — see CLAUDE.md
npm run dev
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — typecheck + production build
- `npm run test` — run unit tests (Vitest)
- `npm run preview` — preview the production build locally
- `npm run lint` — run oxlint
