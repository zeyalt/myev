import { useMemo } from 'react'
import Panel from '../ui/Panel'
import type { DerivedSession } from '../../lib/types'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function SessionHeatmap({ sessions }: { sessions: DerivedSession[] }) {
  const { grid, max, rowTotals, colTotals } = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
    for (const s of sessions) {
      const day = s.startAt.getDay()
      const hour = s.startAt.getHours()
      grid[day][hour] += 1
    }
    const max = Math.max(1, ...grid.flat())
    const rowTotals = grid.map((row) => row.reduce((a, b) => a + b, 0))
    const colTotals = Array.from({ length: 24 }, (_, h) => grid.reduce((sum, row) => sum + row[h], 0))
    return { grid, max, rowTotals, colTotals }
  }, [sessions])

  return (
    <Panel title="Session Heatmap — Day × Hour">
      {sessions.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate">No data for this period</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[3rem_repeat(24,minmax(0,1fr))_3rem] gap-[3px] items-center mb-[3px]">
              <div />
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="text-center text-[9px] text-slate/60 font-mono-nums">
                  {h}
                </div>
              ))}
              <div />
            </div>
            {DAYS.map((day, d) => (
              <div key={day} className="grid grid-cols-[3rem_repeat(24,minmax(0,1fr))_3rem] gap-[3px] items-center mb-[3px]">
                <div className="text-[10px] font-medium text-slate">{day}</div>
                {grid[d].map((count, h) => (
                  <div
                    key={h}
                    title={`${day} ${h}:00 — ${count} session${count === 1 ? '' : 's'}`}
                    className="aspect-square rounded-[3px]"
                    style={{
                      background: count === 0 ? 'rgba(148,163,184,0.06)' : `rgba(0,212,255,${0.15 + 0.75 * (count / max)})`,
                    }}
                  />
                ))}
                <div className="text-[10px] text-slate/70 font-mono-nums text-right">{rowTotals[d]}</div>
              </div>
            ))}
            <div className="grid grid-cols-[3rem_repeat(24,minmax(0,1fr))_3rem] gap-[3px] items-center mt-1">
              <div />
              {colTotals.map((total, h) => (
                <div key={h} className="text-center text-[8px] text-slate/50 font-mono-nums">
                  {total || ''}
                </div>
              ))}
              <div />
            </div>
          </div>
        </div>
      )}
    </Panel>
  )
}
