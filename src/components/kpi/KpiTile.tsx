import clsx from 'clsx'
import type { DeltaResult } from '../../lib/derive'

export default function KpiTile({
  label,
  value,
  delta,
  goodDirection = 'down',
}: {
  label: string
  value: string
  delta?: DeltaResult
  /** which delta direction counts as "good" (green) — spend going down is good, savings going up is good */
  goodDirection?: 'up' | 'down'
}) {
  const isGood = delta && delta.direction !== 'neutral' && delta.direction === goodDirection

  return (
    <div className="glass-panel p-4 flex flex-col gap-1.5 min-w-0">
      <span className="text-[11px] font-medium text-slate uppercase tracking-wider truncate">{label}</span>
      <span className="text-xl font-semibold text-white font-mono-nums truncate">{value}</span>
      {delta && (
        <span
          className={clsx(
            'text-[11px] font-medium font-mono-nums w-fit px-1.5 py-0.5 rounded-full',
            delta.direction === 'neutral' && 'text-slate/70 bg-white/5',
            delta.direction !== 'neutral' && (isGood ? 'text-green bg-green/10' : 'text-amber bg-amber/10'),
          )}
        >
          {delta.label} MoM
        </span>
      )}
    </div>
  )
}
