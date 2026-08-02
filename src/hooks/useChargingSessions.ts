import { useQuery } from '@tanstack/react-query'
import { db } from '../lib/dataApiClient'
import { deriveSessions } from '../lib/derive'
import type { ChargingSessionRow } from '../lib/types'

export const CHARGING_SESSIONS_QUERY_KEY = ['charging_sessions'] as const

async function fetchChargingSessions() {
  const { data, error } = await db
    .from('charging_sessions')
    .select('*')
    .order('start_at', { ascending: true })
  if (error) throw error
  return deriveSessions((data ?? []) as ChargingSessionRow[])
}

export function useChargingSessions() {
  return useQuery({
    queryKey: CHARGING_SESSIONS_QUERY_KEY,
    queryFn: fetchChargingSessions,
    staleTime: 5 * 60 * 1000,
  })
}
