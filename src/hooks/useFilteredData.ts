import { useMemo } from 'react'
import { useFilterStore } from '../store/filterStore'
import { useChargingSessions } from './useChargingSessions'
import { useOtherExpenses } from './useOtherExpenses'
import type { DerivedSession, DerivedExpense } from '../lib/types'

export function useFilteredData() {
  const sessionsQuery = useChargingSessions()
  const expensesQuery = useOtherExpenses()
  const { month, country, chargingType, providers, crossFilterProvider } = useFilterStore()

  const filteredSessions: DerivedSession[] = useMemo(() => {
    const all = sessionsQuery.data ?? []
    return all.filter((s) => {
      if (month && s.monthKey !== month) return false
      if (country !== 'All' && s.country !== country) return false
      if (chargingType !== 'All' && s.chargingType !== chargingType) return false
      if (providers.length > 0 && !providers.includes(s.provider)) return false
      if (crossFilterProvider && s.provider !== crossFilterProvider) return false
      return true
    })
  }, [sessionsQuery.data, month, country, chargingType, providers, crossFilterProvider])

  const filteredExpenses: DerivedExpense[] = useMemo(() => {
    const all = expensesQuery.data ?? []
    return all.filter((e) => {
      if (month && e.monthKey !== month) return false
      return true
    })
  }, [expensesQuery.data, month])

  // Same as filteredSessions but WITHOUT the month restriction — used for MoM
  // delta comparisons, which need both the current and previous month's totals.
  const sessionsAcrossMonths: DerivedSession[] = useMemo(() => {
    const all = sessionsQuery.data ?? []
    return all.filter((s) => {
      if (country !== 'All' && s.country !== country) return false
      if (chargingType !== 'All' && s.chargingType !== chargingType) return false
      if (providers.length > 0 && !providers.includes(s.provider)) return false
      if (crossFilterProvider && s.provider !== crossFilterProvider) return false
      return true
    })
  }, [sessionsQuery.data, country, chargingType, providers, crossFilterProvider])

  const availableMonths = useMemo(() => {
    const set = new Set<string>()
    for (const s of sessionsQuery.data ?? []) set.add(s.monthKey)
    for (const e of expensesQuery.data ?? []) set.add(e.monthKey)
    return Array.from(set).sort().reverse()
  }, [sessionsQuery.data, expensesQuery.data])

  const availableProviders = useMemo(() => {
    const set = new Set<string>()
    for (const s of sessionsQuery.data ?? []) set.add(s.provider)
    return Array.from(set).sort()
  }, [sessionsQuery.data])

  return {
    isLoading: sessionsQuery.isLoading || expensesQuery.isLoading,
    isError: sessionsQuery.isError || expensesQuery.isError,
    dataUpdatedAt: Math.max(sessionsQuery.dataUpdatedAt, expensesQuery.dataUpdatedAt),
    allSessions: sessionsQuery.data ?? [],
    allExpenses: expensesQuery.data ?? [],
    sessions: filteredSessions,
    expenses: filteredExpenses,
    sessionsAcrossMonths,
    expensesAcrossMonths: expensesQuery.data ?? [],
    availableMonths,
    availableProviders,
    activeMonth: month,
  }
}
