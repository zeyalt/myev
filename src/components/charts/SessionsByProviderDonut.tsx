import { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import Panel from '../ui/Panel'
import { providerTotals } from '../../lib/aggregate'
import { PROVIDER_COLORS } from '../../lib/constants'
import { tooltipOpts, legendOpts, chartAnimOpts, makeCenterTextPlugin } from './chartTheme'
import { useFilterStore } from '../../store/filterStore'
import type { DerivedSession } from '../../lib/types'

export default function SessionsByProviderDonut({ sessions }: { sessions: DerivedSession[] }) {
  const { setCrossFilterProvider } = useFilterStore()
  const rows = useMemo(() => providerTotals(sessions).sort((a, b) => b.sessions - a.sessions), [sessions])
  const totalSessions = rows.reduce((sum, r) => sum + r.sessions, 0)

  const data = {
    labels: rows.map((r) => r.provider),
    datasets: [
      {
        data: rows.map((r) => r.sessions),
        backgroundColor: rows.map((_, i) => PROVIDER_COLORS[i % PROVIDER_COLORS.length]),
        borderColor: '#0b0f1a',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  }

  return (
    <Panel title="Sessions by Provider">
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
                tooltip: { ...tooltipOpts, callbacks: { label: (ctx: { label: string; parsed: number }) => ` ${ctx.label}: ${ctx.parsed} sessions` } },
              },
            }}
            plugins={[makeCenterTextPlugin(() => ({ label: 'Sessions', value: String(totalSessions) }))]}
          />
        </div>
      )}
    </Panel>
  )
}
