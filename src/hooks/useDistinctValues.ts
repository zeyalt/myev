import { useQuery } from '@tanstack/react-query'
import { db } from '../lib/dataApiClient'

/** Distinct historical values for a text column, used to power datalist autocomplete on entry forms. */
export function useDistinctValues(table: 'charging_sessions' | 'other_expenses', column: string) {
  return useQuery({
    queryKey: ['distinct', table, column],
    queryFn: async () => {
      const { data, error } = await db.from(table).select(column).limit(1000)
      if (error) throw error
      const values = new Set<string>()
      for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
        const v = row[column]
        if (typeof v === 'string' && v.trim()) values.add(v)
      }
      return Array.from(values).sort()
    },
    staleTime: 10 * 60 * 1000,
  })
}
