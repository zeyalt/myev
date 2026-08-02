import { useMemo, useState, useEffect } from 'react'
import { useFilteredData } from '../hooks/useFilteredData'
import { buildMonthlyInsight, buildAllTimeInsight } from '../lib/insights'
import MonthlyInsightCard from '../components/insights/MonthlyInsightCard'
import AllTimeInsightCard from '../components/insights/AllTimeInsightCard'
import Panel from '../components/ui/Panel'

export default function InsightsPage() {
  const { allSessions, allExpenses, availableMonths, isLoading } = useFilteredData()
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedMonth && availableMonths.length > 0) setSelectedMonth(availableMonths[0])
  }, [availableMonths, selectedMonth])

  const monthlyInsight = useMemo(
    () => (selectedMonth ? buildMonthlyInsight(selectedMonth, allSessions, allExpenses) : null),
    [selectedMonth, allSessions, allExpenses],
  )
  const allTimeInsight = useMemo(() => buildAllTimeInsight(allSessions, allExpenses), [allSessions, allExpenses])

  if (isLoading) {
    return <div className="py-24 text-center text-slate">Loading insights…</div>
  }

  if (allSessions.length === 0 && allExpenses.length === 0) {
    return (
      <Panel className="py-24 text-center text-slate">
        No data yet.{' '}
        <a href="/add" className="text-cyan hover:underline">
          Add your first entry
        </a>{' '}
        to see insights here.
      </Panel>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold text-white">Insights</h1>
        <select
          value={selectedMonth ?? ''}
          onChange={(e) => setSelectedMonth(e.target.value || null)}
          className="bg-surface border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-white font-mono-nums focus:outline-none focus:border-cyan/50"
        >
          {availableMonths.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {monthlyInsight && <MonthlyInsightCard insight={monthlyInsight} />}
      <AllTimeInsightCard insight={allTimeInsight} />
    </div>
  )
}
