import { useMemo } from 'react'
import KpiTile from './KpiTile'
import { useFilterStore } from '../../store/filterStore'
import { useFilteredData } from '../../hooks/useFilteredData'
import { aggregateTotals, groupByMonth } from '../../lib/aggregate'
import { deltaPct, getPrevMonthKey } from '../../lib/derive'
import { fmtCurrency, fmtNumber, fmtCostPerKwh } from '../../lib/format'
import type { DerivedSession, DerivedExpense } from '../../lib/types'

export default function KpiStrip({
  sessions,
  expenses,
}: {
  sessions: DerivedSession[]
  expenses: DerivedExpense[]
  allSessions: DerivedSession[]
  allExpenses: DerivedExpense[]
}) {
  const { sessionsAcrossMonths, expensesAcrossMonths, availableMonths } = useFilteredData()
  const { month: filterMonth } = useFilterStore()

  const current = useMemo(() => aggregateTotals(sessions, expenses), [sessions, expenses])

  const previous = useMemo(() => {
    let currentMonth: string | null = filterMonth
    if (!currentMonth) currentMonth = availableMonths[0] ?? null
    if (!currentMonth) return null
    const prevMonth = getPrevMonthKey(currentMonth)

    const sByMonth = groupByMonth(sessionsAcrossMonths, (s) => s.monthKey)
    const eByMonth = groupByMonth(expensesAcrossMonths, (e) => e.monthKey)
    return aggregateTotals(sByMonth.get(prevMonth) ?? [], eByMonth.get(prevMonth) ?? [])
  }, [filterMonth, availableMonths, sessionsAcrossMonths, expensesAcrossMonths])

  const d = (curVal: number, prevVal: number | undefined) =>
    previous && prevVal !== undefined ? deltaPct(curVal, prevVal) : undefined

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <KpiTile label="Total Spend" value={fmtCurrency(current.totalSpend)} delta={d(current.totalSpend, previous?.totalSpend)} goodDirection="down" />
      <KpiTile label="Total kWh" value={fmtNumber(current.totalKwh, 1)} delta={d(current.totalKwh, previous?.totalKwh)} goodDirection="up" />
      <KpiTile label="Sessions" value={String(current.sessionCount)} delta={d(current.sessionCount, previous?.sessionCount)} goodDirection="up" />
      <KpiTile label="Avg Cost/kWh" value={fmtCostPerKwh(current.avgCostPerKwh)} delta={d(current.avgCostPerKwh, previous?.avgCostPerKwh)} goodDirection="down" />
      <KpiTile label="Est. Distance" value={`${fmtNumber(current.estDistance, 0)} km`} delta={d(current.estDistance, previous?.estDistance)} goodDirection="up" />
      <KpiTile label="Total Savings" value={fmtCurrency(current.totalSavings)} delta={d(current.totalSavings, previous?.totalSavings)} goodDirection="up" />
      <KpiTile label="Gross Charging Spend" value={fmtCurrency(current.grossChargingSpend)} delta={d(current.grossChargingSpend, previous?.grossChargingSpend)} goodDirection="down" />
      <KpiTile label="Net Charging Spend" value={fmtCurrency(current.netChargingSpend)} delta={d(current.netChargingSpend, previous?.netChargingSpend)} goodDirection="down" />
      <KpiTile label="Total Hours Charged" value={`${fmtNumber(current.totalHoursCharged, 1)} h`} delta={d(current.totalHoursCharged, previous?.totalHoursCharged)} goodDirection="down" />
      <KpiTile label="Avg Hrs / 100km" value={current.avgHoursPer100km > 0 ? `${fmtNumber(current.avgHoursPer100km, 2)} h` : '--'} delta={d(current.avgHoursPer100km, previous?.avgHoursPer100km)} goodDirection="down" />
    </div>
  )
}
