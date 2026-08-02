import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import Panel from '../ui/Panel'
import { tooltipOpts, legendOpts, chartAnimOpts, gridOpts, tickOpts } from './chartTheme'
import type { DerivedSession } from '../../lib/types'

export default function EnergyConsumptionChart({ sessions }: { sessions: DerivedSession[] }) {
  const withEnergy = useMemo(() => sessions.filter((s) => s.energyKwhPer100km !== null), [sessions])

  const data = {
    labels: withEnergy.map((s) => s.startAt.toLocaleDateString('en-SG', { day: '2-digit', month: 'short' })),
    datasets: [
      {
        label: 'kWh / 100km',
        data: withEnergy.map((s) => s.energyKwhPer100km),
        borderColor: '#00d4ff',
        backgroundColor: '#00d4ff',
        yAxisID: 'y',
        tension: 0.3,
        pointRadius: 3,
      },
      {
        label: 'Battery % / 100km',
        data: withEnergy.map((s) => s.energyBattPer100km),
        borderColor: '#a78bfa',
        backgroundColor: '#a78bfa',
        yAxisID: 'y1',
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  }

  return (
    <Panel title="Energy Consumption Over Time">
      {withEnergy.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-sm text-slate">
          Not enough consecutive sessions to compute energy consumption yet
        </div>
      ) : (
        <div className="h-72">
          <Line
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
                    afterTitle: (items: { dataIndex: number }[]) => {
                      const s = withEnergy[items[0]?.dataIndex]
                      return s ? `${s.provider} · ${s.location} · ${s.distToNext ?? 0}km driven` : ''
                    },
                  },
                },
              },
              scales: {
                x: { grid: { display: false }, ticks: { ...tickOpts, maxRotation: 0, autoSkip: true } },
                y: { position: 'left', grid: gridOpts, ticks: tickOpts },
                y1: { position: 'right', grid: { display: false }, ticks: tickOpts },
              },
            }}
          />
        </div>
      )}
    </Panel>
  )
}
