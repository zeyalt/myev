import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import Panel from '../ui/Panel'
import { tooltipOpts, chartAnimOpts, gridOpts, tickOpts } from './chartTheme'
import type { DerivedSession } from '../../lib/types'

const BIN_SIZE = 10

export default function BatteryDistributionHistogram({ sessions }: { sessions: DerivedSession[] }) {
  const { labels, counts } = useMemo(() => {
    const bins = Array.from({ length: 10 }, (_, i) => i * BIN_SIZE) // 0-10, 10-20, ..., 90-100
    const counts = Array(bins.length).fill(0)
    for (const s of sessions) {
      const increase = s.battAfter - s.battBefore
      const idx = Math.min(bins.length - 1, Math.max(0, Math.floor(increase / BIN_SIZE)))
      counts[idx] += 1
    }
    return { labels: bins.map((b) => `${b}-${b + BIN_SIZE}%`), counts }
  }, [sessions])

  const data = {
    labels,
    datasets: [{ label: 'Sessions', data: counts, backgroundColor: 'rgba(167,139,250,0.75)', borderRadius: 3 }],
  }

  return (
    <Panel title="Battery Increase Distribution">
      {sessions.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-sm text-slate">No data for this period</div>
      ) : (
        <div className="h-72">
          <Bar
            data={data}
            options={{
              maintainAspectRatio: false,
              animation: chartAnimOpts,
              plugins: { legend: { display: false }, tooltip: tooltipOpts },
              scales: {
                x: { grid: { display: false }, ticks: tickOpts },
                y: { grid: gridOpts, ticks: { ...tickOpts, precision: 0 }, beginAtZero: true },
              },
            }}
          />
        </div>
      )}
    </Panel>
  )
}
