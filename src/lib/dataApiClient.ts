import { createClient } from '@neondatabase/neon-js'

// myev's data layer runs on Neon's Data API (PostgREST-compatible, beta as of
// Oct 2025) + Neon Auth ("Managed Better Auth", beta). Even fully anonymous
// (no-login) access requires a short-lived JWT — `allowAnonymous: true` makes
// the client fetch and attach one automatically on first request. The
// resulting `db` client's query builder (`.from().select()/.insert()/...`)
// is the same @supabase/postgrest-js API Supabase itself uses, since
// NeonPostgrestClient extends PostgrestClient directly.
//
// RLS policies + GRANTs on the "anonymous" Postgres role (see
// neon/01_tables.sql + neon/02_grants.sql) gate what this client can do:
// insert + select only, no update/delete, matching the no-login app design.
const authUrl = import.meta.env.VITE_NEON_AUTH_URL
const dataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL

if (!authUrl || !dataApiUrl) {
  // eslint-disable-next-line no-console
  console.error(
    'Missing VITE_NEON_AUTH_URL / VITE_NEON_DATA_API_URL. Copy .env.example to .env.local and fill in your Neon project\'s Auth URL and Data API URL (Neon Console > Auth / Data API).',
  )
}

export const db = createClient({
  auth: {
    url: authUrl ?? '',
    allowAnonymous: true,
  },
  dataApi: {
    url: dataApiUrl ?? '',
  },
})
