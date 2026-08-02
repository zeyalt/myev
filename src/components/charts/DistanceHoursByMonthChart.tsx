import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import Panel from '../ui/Panel'
import { groupByMonth } from '../../lib/aggregate'
import { tooltipOpts, legendOpts, chartAnimOpts, gridOpts, tickOpts } from './chartTheme'
import type { DerivedSession } from '../../lib/types'

export default function DistanceHoursByMonthChart({ sessions }: { sessions: DerivedSession[] }) {
  const { months, distance, hours } = useMemo(() => {
    const byMonth = groupByMonth(sessions, (s) => s.monthKey)
    const months = Array.from(byMonth.keys()).sort()
    return {
      months,
      distance: months.map((m) => byMonth.get(m)!.reduce((sum, s) => sum + s.distance, 0)),
      hours: months.map((m) => byMonth.get(m)!.reduce((sum, s) => sum + s.durationHours, 0)),
    }
  }, [sessions])

  const data = {
    labels: months,
    datasets: [
      {
        label: 'Est. Distance (km)',
        data: distance,
        backgroundColor: 'rgba(52,211,153,0.7)',
        borderRadius: 4,
        yAxisID: 'y',
      },
      {
        label: 'Hours Charged',
        data: hours,
        backgroundColor: 'rgba(167,139,250,0.7)',
        borderRadius: 4,
        yAxisID: 'y1',
      },
    ],
  }

  return (
    <Panel title="Distance & Hours Charged by Month">
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
              plugins: { legend: legendOpts, tooltip: tooltipOpts },
              scales: {
                x: { grid: { display: false }, ticks: tickOpts },
                y: { position: 'left', grid: gridOpts, ticks: { ...tickOpts, callback: (v: number | string) => `${v}km` } },
                y1: { position: 'right', grid: { display: false }, ticks: { ...tickOpts, callback: (v: number | string) => `${v}h` } },
              },
            }}
          />
        </div>
      )}
    </Panel>
  )
}
