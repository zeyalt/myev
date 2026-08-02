import type { DerivedSession, DerivedExpense } from './types'

export interface PeriodTotals {
  totalSpend: number
  totalKwh: number
  sessionCount: number
  avgCostPerKwh: number
  estDistance: number
  totalSavings: number
  grossChargingSpend: number
  netChargingSpend: number
  totalHoursCharged: number
  avgHoursPer100km: number
}

export function aggregateTotals(sessions: DerivedSession[], expenses: DerivedExpense[]): PeriodTotals {
  const grossChargingSpend = sessions.reduce((sum, s) => sum + s.grossCost, 0)
  const netChargingSpend = sessions.reduce((sum, s) => sum + s.netCost, 0)
  const idleFees = sessions.reduce((sum, s) => sum + s.idleFees, 0)
  const totalSavings = sessions.reduce((sum, s) => sum + s.rebate, 0)
  const totalKwh = sessions.reduce((sum, s) => sum + s.kwh, 0)
  const estDistance = sessions.reduce((sum, s) => sum + s.distance, 0)
  const totalHoursCharged = sessions.reduce((sum, s) => sum + s.durationHours, 0)
  const otherExpenseTotal = expenses.reduce((sum, e) => sum + e.amountSgd, 0)

  return {
    totalSpend: netChargingSpend + idleFees + otherExpenseTotal,
    totalKwh,
    sessionCount: sessions.length,
    avgCostPerKwh: totalKwh > 0 ? grossChargingSpend / totalKwh : 0,
    estDistance,
    totalSavings,
    grossChargingSpend,
    netChargingSpend,
    totalHoursCharged,
    avgHoursPer100km: estDistance > 0 ? (totalHoursCharged / estDistance) * 100 : 0,
  }
}

/** Category totals for the "Expenses by Category" donut, combining EV Charging (net+idle) with Other Expenses categories. */
export function categoryTotals(
  sessions: DerivedSession[],
  expenses: DerivedExpense[],
  evChargingLabel: string,
): { category: string; amount: number }[] {
  const evChargingTotal = sessions.reduce((sum, s) => sum + s.netCost + s.idleFees, 0)
  const byCategory = new Map<string, number>()
  if (evChargingTotal > 0) byCategory.set(evChargingLabel, evChargingTotal)
  for (const e of expenses) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amountSgd)
  }
  return Array.from(byCategory.entries()).map(([category, amount]) => ({ category, amount }))
}

export function providerTotals(sessions: DerivedSession[]): { provider: string; spend: number; sessions: number }[] {
  const byProvider = new Map<string, { spend: number; sessions: number }>()
  for (const s of sessions) {
    const cur = byProvider.get(s.provider) ?? { spend: 0, sessions: 0 }
    cur.spend += s.grossCost
    cur.sessions += 1
    byProvider.set(s.provider, cur)
  }
  return Array.from(byProvider.entries()).map(([provider, v]) => ({ provider, ...v }))
}

export function groupByMonth<T>(items: T[], getMonthKey: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const k = getMonthKey(item)
    const arr = map.get(k) ?? []
    arr.push(item)
    map.set(k, arr)
  }
  return map
}
