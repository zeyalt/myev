import { useQuery } from '@tanstack/react-query'
import { db } from '../lib/dataApiClient'

export interface PastPlanRow {
  location: string
  provider: string
  subscription_plan: string
}

/** Past (location, provider, plan) triples, newest first — feeds plan auto-selection on the entry form. */
export function usePastPlans() {
  return useQuery({
    queryKey: ['pastPlans'],
    queryFn: async (): Promise<PastPlanRow[]> => {
      const { data, error } = await db
        .from('charging_sessions')
        .select('location, provider, subscription_plan')
        .order('start_at', { ascending: false })
        .limit(5000)
      if (error) throw error
      return (data ?? []) as unknown as PastPlanRow[]
    },
    staleTime: 10 * 60 * 1000,
  })
}
