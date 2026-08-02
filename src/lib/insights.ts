// Ports ev-insights-bot's bot/app.py build_insights()/cmd_alltime() aggregation
// logic into pure TS functions consumed by the Insights tab. No Telegram/bot
// integration exists in this project — these functions are used purely to
// compute the same numbers for in-app display.
import { aggregateTotals, categoryTotals, groupByMonth } from './aggregate'
import { computeEnergyConsumptionIQR, deltaPct, getPrevMonthKey } from './derive'
import { EV_CHARGING_CATEGORY_LABEL } from './constants'
import type { DerivedSession, DerivedExpense } from './types'
import type { DeltaResult } from './derive'

export interface CategoryShare {
  category: string
  amount: number
  pctOfTotal: number
}

export interface LocationStat {
  location: string
  provider: string
  sessions: number
  value: number
}

export interface MonthlyInsight {
  month: string
  expenseDistribution: CategoryShare[]
  grossChargingSpend: number
  grossChargingSpendDelta: DeltaResult
  energyChargedKwh: number
  energyChargedDelta: DeltaResult
  hoursCharged: number
  hoursChargedDelta: DeltaResult
  avgHoursPer100km: number
  topCostEfficientLocations: LocationStat[]
  topTimeEfficientLocations: LocationStat[]
  totalDistance: number
  avgDurationHours: number
  avgSpeedKwhPerHour: number
  avgBatteryIncreaseRatePerHour: number
  avgEnergyConsumptionKwhPer100kmIQR: number | null
  topLocationsByUsage: LocationStat[]
  subscriptionVsPayg: {
    subscriptionAvgCostPerKwh: number | null
    paygAvgCostPerKwh: number | null
    savingsPct: number | null
  }
}

export interface AllTimeInsight {
  totalSpend: number
  grossChargingSpend: number
  idleFees: number
  otherExpenseTotal: number
  totalKwh: number
  totalDistance: number
  sessionCount: number
  avgCostPerKwh: number
  monthlyBreakdown: { month: string; grossSpend: number; kwh: number; sessions: number }[]
}

const MIN_SESSIONS_FOR_LOCATION_RANKING = 2

function locationStats(sessions: DerivedSession[], valueFn: (group: DerivedSession[]) => number): LocationStat[] {
  const byKey = new Map<string, DerivedSession[]>()
  for (const s of sessions) {
    const key = `${s.location}|||${s.provider}`
    const arr = byKey.get(key) ?? []
    arr.push(s)
    byKey.set(key, arr)
  }
  const stats: LocationStat[] = []
  for (const [key, group] of byKey) {
    if (group.length < MIN_SESSIONS_FOR_LOCATION_RANKING) continue
    const [location, provider] = key.split('|||')
    stats.push({ location, provider, sessions: group.length, value: valueFn(group) })
  }
  return stats
}

function avg(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function buildMonthlyInsight(
  month: string,
  allSessions: DerivedSession[],
  allExpenses: DerivedExpense[],
): MonthlyInsight {
  const prevMonth = getPrevMonthKey(month)
  const sByMonth = groupByMonth(allSessions, (s) => s.monthKey)
  const eByMonth = groupByMonth(allExpenses, (e) => e.monthKey)

  const sessions = sByMonth.get(month) ?? []
  const expenses = eByMonth.get(month) ?? []
  const prevSessions = sByMonth.get(prevMonth) ?? []
  const prevExpenses = eByMonth.get(prevMonth) ?? []

  const cur = aggregateTotals(sessions, expenses)
  const prev = aggregateTotals(prevSessions, prevExpenses)

  const catTotals = categoryTotals(sessions, expenses, EV_CHARGING_CATEGORY_LABEL)
  const totalForShare = catTotals.reduce((sum, c) => sum + c.amount, 0)
  const expenseDistribution: CategoryShare[] = catTotals
    .map((c) => ({ ...c, pctOfTotal: totalForShare > 0 ? (c.amount / totalForShare) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount)

  const costEfficient = locationStats(sessions, (g) => {
    const totalKwh = g.reduce((sum, s) => sum + s.kwh, 0)
    const totalGross = g.reduce((sum, s) => sum + s.grossCost, 0)
    return totalKwh > 0 ? totalGross / totalKwh : 0
  })
    .sort((a, b) => a.value - b.value)
    .slice(0, 5)

  const timeEfficient = locationStats(sessions, (g) => avg(g.map((s) => s.chargingSpeedKwhPerHour)))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const topByUsage = locationStats(sessions, (g) => g.length)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)

  const subscriptionSessions = sessions.filter((s) => s.subscriptionPlan && s.subscriptionPlan !== 'None')
  const paygSessions = sessions.filter((s) => !s.subscriptionPlan || s.subscriptionPlan === 'None')
  const subCostPerKwh =
    subscriptionSessions.length > 0
      ? subscriptionSessions.reduce((sum, s) => sum + s.grossCost, 0) / subscriptionSessions.reduce((sum, s) => sum + s.kwh, 0)
      : null
  const paygCostPerKwh =
    paygSessions.length > 0
      ? paygSessions.reduce((sum, s) => sum + s.grossCost, 0) / paygSessions.reduce((sum, s) => sum + s.kwh, 0)
      : null

  return {
    month,
    expenseDistribution,
    grossChargingSpend: cur.grossChargingSpend,
    grossChargingSpendDelta: deltaPct(cur.grossChargingSpend, prev.grossChargingSpend),
    energyChargedKwh: cur.totalKwh,
    energyChargedDelta: deltaPct(cur.totalKwh, prev.totalKwh),
    hoursCharged: cur.totalHoursCharged,
    hoursChargedDelta: deltaPct(cur.totalHoursCharged, prev.totalHoursCharged),
    avgHoursPer100km: cur.avgHoursPer100km,
    topCostEfficientLocations: costEfficient,
    topTimeEfficientLocations: timeEfficient,
    totalDistance: cur.estDistance,
    avgDurationHours: avg(sessions.map((s) => s.durationHours)),
    avgSpeedKwhPerHour: avg(sessions.map((s) => s.chargingSpeedKwhPerHour)),
    avgBatteryIncreaseRatePerHour: avg(sessions.map((s) => s.batteryIncreaseRatePerHour)),
    avgEnergyConsumptionKwhPer100kmIQR: computeEnergyConsumptionIQR(sessions),
    topLocationsByUsage: topByUsage,
    subscriptionVsPayg: {
      subscriptionAvgCostPerKwh: subCostPerKwh,
      paygAvgCostPerKwh: paygCostPerKwh,
      savingsPct:
        subCostPerKwh !== null && paygCostPerKwh !== null && paygCostPerKwh > 0
          ? ((paygCostPerKwh - subCostPerKwh) / paygCostPerKwh) * 100
          : null,
    },
  }
}

export function buildAllTimeInsight(allSessions: DerivedSession[], allExpenses: DerivedExpense[]): AllTimeInsight {
  const totals = aggregateTotals(allSessions, allExpenses)
  const idleFees = allSessions.reduce((sum, s) => sum + s.idleFees, 0)
  const otherExpenseTotal = allExpenses.reduce((sum, e) => sum + e.amountSgd, 0)

  const sByMonth = groupByMonth(allSessions, (s) => s.monthKey)
  const months = Array.from(sByMonth.keys()).sort()
  const monthlyBreakdown = months.map((m) => {
    const group = sByMonth.get(m)!
    return {
      month: m,
      grossSpend: group.reduce((sum, s) => sum + s.grossCost, 0),
      kwh: group.reduce((sum, s) => sum + s.kwh, 0),
      sessions: group.length,
    }
  })

  return {
    totalSpend: totals.totalSpend,
    grossChargingSpend: totals.grossChargingSpend,
    idleFees,
    otherExpenseTotal,
    totalKwh: totals.totalKwh,
    totalDistance: totals.estDistance,
    sessionCount: totals.sessionCount,
    avgCostPerKwh: totals.avgCostPerKwh,
    monthlyBreakdown,
  }
}
