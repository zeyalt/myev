// Pure, framework-agnostic derivation functions. Mirrors ev-insights-bot's
// bot/app.py (`fetch_data`, `compute_energy_consumption`) and bot/dashboard.html
// (`processData`). All UI components consume DerivedSession[]/DerivedExpense[],
// never raw database rows.
import type { ChargingSessionRow, OtherExpenseRow, DerivedSession, DerivedExpense } from './types'

export function toSgd(amount: number, fxRateToSgd: number): number {
  return amount * fxRateToSgd
}

export function monthKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function getPrevMonthKey(mk: string): string {
  const [y, m] = mk.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 - 1, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export interface DeltaResult {
  pct: number | null
  label: string
  direction: 'up' | 'down' | 'neutral'
}

export function deltaPct(cur: number, prev: number): DeltaResult {
  if (prev === 0) {
    return { pct: null, label: cur === 0 ? 'N/A' : 'New', direction: 'neutral' }
  }
  const pct = ((cur - prev) / Math.abs(prev)) * 100
  const direction = pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral'
  return { pct, label: `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`, direction }
}

/**
 * Transforms raw charging_sessions rows into DerivedSession[], sorted by start
 * time ascending, with distance and (raw, unfiltered) energy-consumption fields
 * computed between consecutive sessions.
 */
export function deriveSessions(rows: ChargingSessionRow[]): DerivedSession[] {
  const base = rows
    .map((r): Omit<DerivedSession, 'distance' | 'energyKwhPer100km' | 'energyBattPer100km' | 'distToNext'> => {
      const startAt = new Date(r.start_at)
      const endAt = new Date(r.end_at)
      const durationHours = (endAt.getTime() - startAt.getTime()) / 1000 / 3600
      const grossCost = toSgd(r.cost, r.fx_rate_to_sgd)
      const rebate = toSgd(r.rebate, r.fx_rate_to_sgd)
      const idleFees = toSgd(r.idle_fees, r.fx_rate_to_sgd)
      const netCost = grossCost - rebate
      const costPerKwh = r.kwh > 0 ? grossCost / r.kwh : 0
      const chargingSpeedKwhPerHour = durationHours > 0 ? r.kwh / durationHours : 0
      const batteryIncreaseRatePerHour = durationHours > 0 ? (r.batt_after_pct - r.batt_before_pct) / durationHours : 0

      return {
        id: r.id,
        startAt,
        endAt,
        durationHours,
        kwh: r.kwh,
        odometerKm: r.odometer_km,
        battBefore: r.batt_before_pct,
        battAfter: r.batt_after_pct,
        grossCost,
        rebate,
        idleFees,
        netCost,
        costPerKwh,
        chargingSpeedKwhPerHour,
        batteryIncreaseRatePerHour,
        country: r.country,
        chargingType: r.charging_type,
        location: r.location,
        provider: r.provider,
        subscriptionPlan: r.subscription_plan,
        paidBy: r.paid_by,
        currency: r.currency,
        monthKey: monthKey(startAt),
      }
    })
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())

  const withDistance = base.map((s, i) => ({
    ...s,
    distance: i === 0 ? 0 : Math.max(0, s.odometerKm - base[i - 1].odometerKm),
  }))

  return withDistance.map((s, i) => {
    const next = withDistance[i + 1]
    if (!next) {
      return { ...s, energyKwhPer100km: null, energyBattPer100km: null, distToNext: null }
    }
    const dist = next.distance
    const battIncrease = s.battAfter - s.battBefore
    const battDrop = s.battAfter - next.battBefore
    if (!(dist > 0 && battIncrease > 0 && battDrop >= 0)) {
      return { ...s, energyKwhPer100km: null, energyBattPer100km: null, distToNext: dist }
    }
    const kwhPerPct = s.kwh / battIncrease
    const kwhConsumed = kwhPerPct * battDrop
    return {
      ...s,
      energyKwhPer100km: (kwhConsumed / dist) * 100,
      energyBattPer100km: (battDrop / dist) * 100,
      distToNext: dist,
    }
  })
}

export function deriveExpenses(rows: OtherExpenseRow[]): DerivedExpense[] {
  return rows
    .map((r) => {
      const date = new Date(`${r.expense_date}T00:00:00`)
      return {
        id: r.id,
        date,
        category: r.category,
        amountSgd: r.amount_sgd,
        paymentMethod: r.payment_method,
        paidBy: r.paid_by,
        monthKey: monthKey(date),
      }
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

/**
 * IQR-outlier-filtered average kWh/100km, used only by the Insights panel's
 * narrative "avg energy consumption" figure (mirrors app.py's
 * compute_energy_consumption()). The dashboard chart uses raw
 * DerivedSession.energyKwhPer100km values instead.
 */
export function computeEnergyConsumptionIQR(sessions: DerivedSession[]): number | null {
  const values = sessions
    .map((s) => s.energyKwhPer100km)
    .filter((v): v is number => v !== null && Number.isFinite(v))
  if (values.length === 0) return null
  if (values.length < 4) {
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  const sorted = [...values].sort((a, b) => a - b)
  const quantile = (q: number) => {
    const pos = (sorted.length - 1) * q
    const base = Math.floor(pos)
    const rest = pos - base
    return sorted[base + 1] !== undefined ? sorted[base] + rest * (sorted[base + 1] - sorted[base]) : sorted[base]
  }
  const q1 = quantile(0.25)
  const q3 = quantile(0.75)
  const iqr = q3 - q1
  const lower = q1 - 1.5 * iqr
  const upper = q3 + 1.5 * iqr
  const filtered = values.filter((v) => v >= lower && v <= upper)
  if (filtered.length === 0) return values.reduce((a, b) => a + b, 0) / values.length
  return filtered.reduce((a, b) => a + b, 0) / filtered.length
}
