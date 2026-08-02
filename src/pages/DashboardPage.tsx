import { useFilteredData } from '../hooks/useFilteredData'
import FilterBar from '../components/filters/FilterBar'
import KpiStrip from '../components/kpi/KpiStrip'
import ExpensesByCategoryDonut from '../components/charts/ExpensesByCategoryDonut'
import ProviderSpendDonut from '../components/charts/ProviderSpendDonut'
import SessionsByProviderDonut from '../components/charts/SessionsByProviderDonut'
import SessionHeatmap from '../components/charts/SessionHeatmap'
import SpendByMonthChart from '../components/charts/SpendByMonthChart'
import DistanceHoursByMonthChart from '../components/charts/DistanceHoursByMonthChart'
import ProviderLocationTable from '../components/charts/ProviderLocationTable'
import BatteryBehaviourChart from '../components/charts/BatteryBehaviourChart'
import BatteryDistributionHistogram from '../components/charts/BatteryDistributionHistogram'
import EnergyConsumptionChart from '../components/charts/EnergyConsumptionChart'
import SessionsTable from '../components/table/SessionsTable'
import Panel from '../components/ui/Panel'

export default function DashboardPage() {
  const data = useFilteredData()

  if (data.isLoading) {
    return <div className="py-24 text-center text-slate">Loading your EV data…</div>
  }

  if (data.isError) {
    return (
      <div className="py-24 text-center text-red">
        Couldn't load data from Neon. Check your VITE_NEON_DATA_API_URL / VITE_NEON_ANON_KEY in .env.local.
      </div>
    )
  }

  const hasData = data.allSessions.length > 0 || data.allExpenses.length > 0

  return (
    <div className="flex flex-col gap-6">
      <FilterBar availableMonths={data.availableMonths} availableProviders={data.availableProviders} />

      {!hasData ? (
        <Panel className="py-24 text-center text-slate">
          No data yet.{' '}
          <a href="/add" className="text-cyan hover:underline">
            Add your first charging session
          </a>{' '}
          to see insights here.
        </Panel>
      ) : (
        <>
          <KpiStrip sessions={data.sessions} expenses={data.expenses} allSessions={data.allSessions} allExpenses={data.allExpenses} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ExpensesByCategoryDonut sessions={data.sessions} expenses={data.expenses} />
            <ProviderSpendDonut sessions={data.sessions} />
            <SessionsByProviderDonut sessions={data.sessions} />
          </div>

          <SessionHeatmap sessions={data.sessions} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SpendByMonthChart sessions={data.allSessions} />
            <DistanceHoursByMonthChart sessions={data.allSessions} />
          </div>

          <ProviderLocationTable sessions={data.sessions} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BatteryBehaviourChart sessions={data.sessions} />
            <BatteryDistributionHistogram sessions={data.sessions} />
          </div>

          <EnergyConsumptionChart sessions={data.sessions} />

          <SessionsTable sessions={data.sessions} />
        </>
      )}
    </div>
  )
}
