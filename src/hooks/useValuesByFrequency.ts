import { useQuery } from '@tanstack/react-query'
import { db } from '../lib/dataApiClient'

/**
 * Historical values for a text column, ranked by frequency (most-used first).
 * Case-insensitive dedupe: variants that differ only by case (e.g. "chargEV"
 * vs "ChargEV") are merged into one entry, keeping whichever casing occurs
 * most often as the canonical display label — powers the "top options + Other"
 * dropdown pattern on entry forms.
 */
export function useValuesByFrequency(table: 'charging_sessions' | 'other_expenses', column: string) {
  return useQuery({
    queryKey: ['valuesByFrequency', table, column],
    queryFn: async () => {
      const { data, error } = await db.from(table).select(column).limit(5000)
      if (error) throw error

      const countsByKey = new Map<string, { label: string; count: number }>()
      for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
        const v = row[column]
        if (typeof v !== 'string' || !v.trim()) continue
        const value = v.trim()
        const key = value.toLowerCase()
        const existing = countsByKey.get(key)
        if (existing) {
          existing.count += 1
          // Casing is fixed to whichever variant was encountered first for
          // this key; case counts are merged so frequency ranking is accurate.
        } else {
          countsByKey.set(key, { label: value, count: 1 })
        }
      }

      return Array.from(countsByKey.values())
        .sort((a, b) => b.count - a.count)
        .map((v) => v.label)
    },
    staleTime: 10 * 60 * 1000,
  })
}
