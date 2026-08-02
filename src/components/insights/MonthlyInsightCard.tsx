import type { ReactNode } from 'react'
import Panel from '../ui/Panel'
import { fmtCurrency, fmtNumber, fmtPct, fmtCostPerKwh } from '../../lib/format'
import type { MonthlyInsight } from '../../lib/insights'

function DeltaBadge({ delta, goodDirection = 'down' }: { delta: MonthlyInsight['grossChargingSpendDelta']; goodDirection?: 'up' | 'down' }) {
  const isGood = delta.direction !== 'neutral' && delta.direction === goodDirection
  return (
    <span
      className={
        delta.direction === 'neutral'
          ? 'text-slate/70'
          : isGood
            ? 'text-green'
            : 'text-amber'
      }
    >
      {delta.label}
    </span>
  )
}

export default function MonthlyInsightCard({ insight }: { insight: MonthlyInsight }) {
  return (
    <Panel title={`Monthly Insights — ${insight.month}`} className="flex flex-col gap-6">
      <section>
        <h4 className="text-xs font-semibold text-slate uppercase tracking-wider mb-2">Expense Distribution</h4>
        <ul className="flex flex-col gap-1.5">
          {insight.expenseDistribution.map((c) => (
            <li key={c.category} className="flex items-center justify-between text-sm">
              <span className="text-white">{c.category}</span>
              <span className="font-mono-nums text-slate">
                {fmtCurrency(c.amount)} ({fmtPct(c.pctOfTotal)})
              </span>
            </li>
          ))}
          {insight.expenseDistribution.length === 0 && <li className="text-sm text-slate">No expenses this month</li>}
        </ul>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Gross Charging Spend" value={fmtCurrency(insight.grossChargingSpend)}>
          <DeltaBadge delta={insight.grossChargingSpendDelta} goodDirection="down" />
        </Stat>
        <Stat label="Energy Charged" value={`${fmtNumber(insight.energyChargedKwh, 1)} kWh`}>
          <DeltaBadge delta={insight.energyChargedDelta} goodDirection="up" />
        </Stat>
        <Stat label="Hours Charged" value={`${fmtNumber(insight.hoursCharged, 1)} h`}>
          <DeltaBadge delta={insight.hoursChargedDelta} goodDirection="down" />
        </Stat>
        <Stat label="Avg Hrs / 100km" value={insight.avgHoursPer100km > 0 ? `${fmtNumber(insight.avgHoursPer100km, 2)} h` : '--'} />
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <section>
          <h4 className="text-xs font-semibold text-slate uppercase tracking-wider mb-2">Top 5 Cost-Efficient Locations</h4>
          <RankedList
            items={insight.topCostEfficientLocations}
            renderValue={(v) => fmtCostPerKwh(v)}
          />
        </section>
        <section>
          <h4 className="text-xs font-semibold text-slate uppercase tracking-wider mb-2">Top 5 Time-Efficient Locations</h4>
          <RankedList items={insight.topTimeEfficientLocations} renderValue={(v) => `${fmtNumber(v, 2)} kWh/h`} />
        </section>
      </div>

      <section>
        <h4 className="text-xs font-semibold text-slate uppercase tracking-wider mb-2">Extra Insights</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <ExtraStat label="Total Distance" value={`${fmtNumber(insight.totalDistance, 0)} km`} />
          <ExtraStat label="Avg Charging Duration" value={`${fmtNumber(insight.avgDurationHours, 2)} h`} />
          <ExtraStat label="Avg Charging Speed" value={`${fmtNumber(insight.avgSpeedKwhPerHour, 2)} kWh/h`} />
          <ExtraStat label="Avg Battery Increase Rate" value={`${fmtNumber(insight.avgBatteryIncreaseRatePerHour, 1)} %/h`} />
          <ExtraStat
            label="Avg Energy Consumption"
            value={insight.avgEnergyConsumptionKwhPer100kmIQR !== null ? `${fmtNumber(insight.avgEnergyConsumptionKwhPer100kmIQR, 1)} kWh/100km` : '--'}
          />
        </div>
        {insight.topLocationsByUsage.length > 0 && (
          <p className="text-sm text-slate mt-3">
            Most used: {insight.topLocationsByUsage.map((l) => `${l.location} (${l.sessions})`).join(', ')}
          </p>
        )}
        {insight.subscriptionVsPayg.savingsPct !== null && (
          <p className="text-sm text-slate mt-1">
            Subscription plans saved you{' '}
            <span className={insight.subscriptionVsPayg.savingsPct > 0 ? 'text-green' : 'text-amber'}>
              {fmtPct(insight.subscriptionVsPayg.savingsPct)}
            </span>{' '}
            per kWh vs pay-as-you-go this month.
          </p>
        )}
      </section>
    </Panel>
  )
}

function Stat({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-slate uppercase tracking-wider">{label}</span>
      <span className="text-base font-semibold text-white font-mono-nums">{value}</span>
      {children && <span className="text-xs font-mono-nums">{children}</span>}
    </div>
  )
}

function ExtraStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-slate text-xs">{label}</span>
      <span className="font-mono-nums text-white">{value}</span>
    </div>
  )
}

function RankedList({ items, renderValue }: { items: { location: string; provider: string; value: number }[]; renderValue: (v: number) => string }) {
  if (items.length === 0) return <p className="text-sm text-slate">Not enough data (needs ≥2 sessions per location)</p>
  return (
    <ol className="flex flex-col gap-1.5">
      {items.map((item, i) => (
        <li key={`${item.location}-${item.provider}`} className="flex items-center justify-between text-sm">
          <span className="text-white">
            {i + 1}. {item.location} <span className="text-slate">· {item.provider}</span>
          </span>
          <span className="font-mono-nums text-cyan">{renderValue(item.value)}</span>
        </li>
      ))}
    </ol>
  )
}
