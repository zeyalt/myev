import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import Panel from '../ui/Panel'
import { groupByMonth } from '../../lib/aggregate'
import { fmtCurrency } from '../../lib/format'
import { tooltipOpts, legendOpts, chartAnimOpts, gridOpts, tickOpts } from './chartTheme'
import type { DerivedSession } from '../../lib/types'

export default function SpendByMonthChart({ sessions }: { sessions: DerivedSession[] }) {
  const { months, spend, count } = useMemo(() => {
    const byMonth = groupByMonth(sessions, (s) => s.monthKey)
    const months = Array.from(byMonth.keys()).sort()
    return {
      months,
      spend: months.map((m) => byMonth.get(m)!.reduce((sum, s) => sum + s.grossCost, 0)),
      count: months.map((m) => byMonth.get(m)!.length),
    }
  }, [sessions])

  // Mixed bar+line dataset — chart.js supports this at runtime via per-dataset
  // `type`, but its TS types don't model mixed-chart datasets cleanly.
  const data = {
    labels: months,
    datasets: [
      {
        label: 'Gross Spend',
        data: spend,
        backgroundColor: 'rgba(0,212,255,0.7)',
        borderRadius: 4,
        yAxisID: 'y',
        order: 2,
      },
      {
        label: 'Sessions',
        data: count,
        type: 'line' as const,
        borderColor: '#ffb020',
        backgroundColor: '#ffb020',
        yAxisID: 'y1',
        tension: 0.3,
        pointRadius: 3,
        order: 1,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any,
  }

  return (
    <Panel title="Gross Charging Spend by Month">
      {months.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-sm text-slate">No data for this period</div>
      ) : (
        <div className="h-72">
          <Bar
            data={data}
            options={{
              maintainAspectRatio: false,
              animation: chartAnimOpts,
              interaction: { mode: 'index', intersect: false },
              plugins: {
                legend: legendOpts,
                tooltip: {
                  ...tooltipOpts,
                  callbacks: {
                    label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) =>
                      ctx.dataset.label === 'Gross Spend'
                        ? ` Gross Spend: ${fmtCurrency(ctx.parsed.y)}`
                        : ` Sessions: ${ctx.parsed.y}`,
                  },
                },
              },
              scales: {
                x: { grid: { display: false }, ticks: tickOpts },
                y: { position: 'left', grid: gridOpts, ticks: { ...tickOpts, callback: (v: number | string) => `$${v}` } },
                y1: { position: 'right', grid: { display: false }, ticks: tickOpts },
              },
            }}
          />
        </div>
      )}
    </Panel>
  )
}
