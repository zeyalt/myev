import { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import Panel from '../ui/Panel'
import { providerTotals } from '../../lib/aggregate'
import { PROVIDER_COLORS } from '../../lib/constants'
import { fmtCurrency } from '../../lib/format'
import { tooltipOpts, legendOpts, chartAnimOpts, makeCenterTextPlugin } from './chartTheme'
import { useFilterStore } from '../../store/filterStore'
import type { DerivedSession } from '../../lib/types'

export default function ProviderSpendDonut({ sessions }: { sessions: DerivedSession[] }) {
  const { setCrossFilterProvider } = useFilterStore()
  const rows = useMemo(() => providerTotals(sessions).sort((a, b) => b.spend - a.spend), [sessions])
  const total = rows.reduce((sum, r) => sum + r.spend, 0)

  const data = {
    labels: rows.map((r) => r.provider),
    datasets: [
      {
        data: rows.map((r) => r.spend),
        backgroundColor: rows.map((_, i) => PROVIDER_COLORS[i % PROVIDER_COLORS.length]),
        borderColor: '#0b0f1a',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  }

  return (
    <Panel title="Gross Spend by Provider">
      {rows.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-slate">No data for this period</div>
      ) : (
        <div className="h-64">
          <Doughnut
            data={data}
            options={{
              maintainAspectRatio: false,
              cutout: '68%',
              animation: chartAnimOpts,
              onClick: (_evt: unknown, elements: { index: number }[]) => {
                if (elements.length > 0) setCrossFilterProvider(rows[elements[0].index].provider)
              },
              plugins: {
                legend: legendOpts,
                tooltip: {
                  ...tooltipOpts,
                  callbacks: { label: (ctx: { label: string; parsed: number }) => ` ${ctx.label}: ${fmtCurrency(ctx.parsed)}` },
                },
              },
            }}
            plugins={[makeCenterTextPlugin(() => ({ label: 'Gross Spend', value: fmtCurrency(total, 0) }))]}
          />
        </div>
      )}
    </Panel>
  )
}
