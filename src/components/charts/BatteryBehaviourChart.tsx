import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import Panel from '../ui/Panel'
import { tooltipOpts, chartAnimOpts, gridOpts, tickOpts, makeThresholdLinesPlugin } from './chartTheme'
import type { DerivedSession } from '../../lib/types'

const thresholdPlugin = makeThresholdLinesPlugin([
  { value: 80, color: 'rgba(52,211,153,0.6)' },
  { value: 20, color: 'rgba(255,107,107,0.6)' },
])

export default function BatteryBehaviourChart({ sessions }: { sessions: DerivedSession[] }) {
  const { labels, before, after } = useMemo(
    () => ({
      labels: sessions.map((s) => s.startAt.toLocaleDateString('en-SG', { day: '2-digit', month: 'short' })),
      before: sessions.map((s) => s.battBefore),
      after: sessions.map((s) => s.battAfter),
    }),
    [sessions],
  )

  const data = {
    labels,
    datasets: [
      { label: 'Battery Before', data: before, backgroundColor: 'rgba(148,163,184,0.5)', borderRadius: 3 },
      { label: 'Battery After', data: after, backgroundColor: 'rgba(0,212,255,0.75)', borderRadius: 3 },
    ],
  }

  return (
    <Panel title="Battery Behaviour">
      {sessions.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-sm text-slate">No data for this period</div>
      ) : (
        <div className="h-72">
          <Bar
            data={data}
            options={{
              maintainAspectRatio: false,
              animation: chartAnimOpts,
              plugins: {
                legend: { display: true, position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } },
                tooltip: { ...tooltipOpts, callbacks: { label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) => ` ${ctx.dataset.label}: ${ctx.parsed.y}%` } },
              },
              scales: {
                x: { grid: { display: false }, ticks: { ...tickOpts, maxRotation: 0, autoSkip: true } },
                y: { min: 0, max: 100, grid: gridOpts, ticks: { ...tickOpts, callback: (v: number | string) => `${v}%` } },
              },
            }}
            plugins={[thresholdPlugin]}
          />
        </div>
      )}
    </Panel>
  )
}
