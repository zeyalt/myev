import Panel from '../ui/Panel'
import { fmtCurrency, fmtNumber, fmtCostPerKwh } from '../../lib/format'
import type { AllTimeInsight } from '../../lib/insights'

export default function AllTimeInsightCard({ insight }: { insight: AllTimeInsight }) {
  return (
    <Panel title="All-Time Summary" className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Total Spend" value={fmtCurrency(insight.totalSpend)} />
        <Stat label="Gross Charging" value={fmtCurrency(insight.grossChargingSpend)} />
        <Stat label="Idle Fees" value={fmtCurrency(insight.idleFees)} />
        <Stat label="Other Expenses" value={fmtCurrency(insight.otherExpenseTotal)} />
        <Stat label="Total kWh" value={fmtNumber(insight.totalKwh, 1)} />
        <Stat label="Total Distance" value={`${fmtNumber(insight.totalDistance, 0)} km`} />
        <Stat label="Sessions" value={String(insight.sessionCount)} />
        <Stat label="Avg Cost/kWh" value={fmtCostPerKwh(insight.avgCostPerKwh)} />
      </div>

      <section>
        <h4 className="text-xs font-semibold text-slate uppercase tracking-wider mb-2">Monthly Breakdown</h4>
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left px-5 py-2 text-[11px] font-medium text-slate uppercase tracking-wider">Month</th>
                <th className="text-left px-5 py-2 text-[11px] font-medium text-slate uppercase tracking-wider">Gross Spend</th>
                <th className="text-left px-5 py-2 text-[11px] font-medium text-slate uppercase tracking-wider">kWh</th>
                <th className="text-left px-5 py-2 text-[11px] font-medium text-slate uppercase tracking-wider">Sessions</th>
              </tr>
            </thead>
            <tbody>
              {[...insight.monthlyBreakdown].reverse().map((row) => (
                <tr key={row.month} className="border-b border-white/5">
                  <td className="px-5 py-2 font-mono-nums text-white">{row.month}</td>
                  <td className="px-5 py-2 font-mono-nums">{fmtCurrency(row.grossSpend)}</td>
                  <td className="px-5 py-2 font-mono-nums">{fmtNumber(row.kwh, 1)}</td>
                  <td className="px-5 py-2 font-mono-nums">{row.sessions}</td>
                </tr>
              ))}
              {insight.monthlyBreakdown.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-slate">
                    No data yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </Panel>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-slate uppercase tracking-wider">{label}</span>
      <span className="text-base font-semibold text-white font-mono-nums">{value}</span>
    </div>
  )
}
