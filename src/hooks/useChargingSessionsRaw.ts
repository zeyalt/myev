import { useQuery } from '@tanstack/react-query'
import { db } from '../lib/dataApiClient'
import { deriveRecordRows } from '../lib/derive'
import type { ChargingSessionRow } from '../lib/types'

export const CHARGING_SESSIONS_RAW_QUERY_KEY = ['charging_sessions_raw'] as const

async function fetchChargingSessionsRaw() {
  const { data, error } = await db
    .from('charging_sessions')
    .select('*')
    .order('start_at', { ascending: true })
  if (error) throw error
  return deriveRecordRows((data ?? []) as ChargingSessionRow[])
}

/** All charging sessions, including in-progress ones — powers the Records page. */
export function useChargingSessionsRaw() {
  return useQuery({
    queryKey: CHARGING_SESSIONS_RAW_QUERY_KEY,
    queryFn: fetchChargingSessionsRaw,
    staleTime: 60 * 1000,
  })
}
