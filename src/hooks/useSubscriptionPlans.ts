import { useQuery } from '@tanstack/react-query'
import { db } from '../lib/dataApiClient'
import type { SubscriptionPlanDef } from '../lib/subscription'
import type { SubscriptionPlanRow } from '../lib/types'

export const SUBSCRIPTION_PLANS_QUERY_KEY = ['subscriptionPlans'] as const

/** User-managed plans from Neon (Settings page), alphabetical. Errors if neon/05 hasn't been run. */
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: SUBSCRIPTION_PLANS_QUERY_KEY,
    queryFn: async (): Promise<SubscriptionPlanDef[]> => {
      const { data, error } = await db.from('subscription_plans').select('*').order('name', { ascending: true })
      if (error) throw error
      return ((data ?? []) as SubscriptionPlanRow[]).map((r) => ({
        id: r.id,
        name: r.name,
        kwh: r.kwh === null ? null : Number(r.kwh),
        priceSgd: r.price_sgd === null ? null : Number(r.price_sgd),
      }))
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
