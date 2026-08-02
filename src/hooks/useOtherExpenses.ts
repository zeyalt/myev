import { useQuery } from '@tanstack/react-query'
import { db } from '../lib/dataApiClient'
import { deriveExpenses } from '../lib/derive'
import type { OtherExpenseRow } from '../lib/types'

export const OTHER_EXPENSES_QUERY_KEY = ['other_expenses'] as const

async function fetchOtherExpenses() {
  const { data, error } = await db
    .from('other_expenses')
    .select('*')
    .order('expense_date', { ascending: true })
  if (error) throw error
  return deriveExpenses((data ?? []) as OtherExpenseRow[])
}

export function useOtherExpenses() {
  return useQuery({
    queryKey: OTHER_EXPENSES_QUERY_KEY,
    queryFn: fetchOtherExpenses,
    staleTime: 5 * 60 * 1000,
  })
}
