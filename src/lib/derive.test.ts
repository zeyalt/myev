import { describe, it, expect } from 'vitest'
import { deriveSessions, deltaPct, monthKey, getPrevMonthKey, computeEnergyConsumptionIQR } from './derive'
import type { ChargingSessionRow, DerivedSession } from './types'

function row(overrides: Partial<ChargingSessionRow>): ChargingSessionRow {
  return {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    start_at: '2026-01-01T08:00:00Z',
    end_at: '2026-01-01T09:00:00Z',
    idle_start_at: null,
    idle_end_at: null,
    kwh: 10,
    odometer_km: 1000,
    batt_before_pct: 20,
    batt_after_pct: 80,
    cost: 10,
    rebate: 0,
    idle_fees: 0,
    currency: 'SGD',
    fx_rate_to_sgd: 1,
    fx_rate_source: 'api',
    country: 'Singapore',
    charging_type: 'AC',
    location: 'Test Location',
    provider: 'Test Provider',
    subscription_plan: 'None',
    paid_by: 'Me',
    ...overrides,
  }
}

describe('deriveSessions', () => {
  it('first session gets distance 0 and no next-session energy fields on the last row', () => {
    const [only] = deriveSessions([row({})])
    expect(only.distance).toBe(0)
    expect(only.energyKwhPer100km).toBeNull()
    expect(only.energyBattPer100km).toBeNull()
  })

  it('computes distance as the odometer delta from the previous session, clipped at 0', () => {
    const rows = [
      row({ id: 'a', start_at: '2026-01-01T08:00:00Z', end_at: '2026-01-01T09:00:00Z', odometer_km: 1000 }),
      row({ id: 'b', start_at: '2026-01-02T08:00:00Z', end_at: '2026-01-02T09:00:00Z', odometer_km: 1150 }),
    ]
    const [, second] = deriveSessions(rows)
    expect(second.distance).toBe(150)
  })

  it('clips negative odometer deltas (e.g. odometer reset) to 0 distance', () => {
    const rows = [
      row({ id: 'a', start_at: '2026-01-01T08:00:00Z', odometer_km: 5000 }),
      row({ id: 'b', start_at: '2026-01-02T08:00:00Z', odometer_km: 100 }),
    ]
    const [, second] = deriveSessions(rows)
    expect(second.distance).toBe(0)
  })

  it('computes energy consumption between consecutive sessions per the documented formula', () => {
    // session i: kwh=10, batt 20->80 (increase=60); distance to next = 150km
    // session i+1: batt before = 30 -> battDrop = 80-30 = 50
    const rows = [
      row({ id: 'a', start_at: '2026-01-01T08:00:00Z', odometer_km: 1000, kwh: 10, batt_before_pct: 20, batt_after_pct: 80 }),
      row({ id: 'b', start_at: '2026-01-02T08:00:00Z', odometer_km: 1150, batt_before_pct: 30, batt_after_pct: 90 }),
    ]
    const [first] = deriveSessions(rows)
    // kwhPerPct = 10/60 = 0.16667; kwhConsumed = 0.16667 * 50 = 8.3333
    // energyKwhPer100km = 8.3333/150*100 = 5.5556
    expect(first.energyKwhPer100km).toBeCloseTo(5.5556, 3)
    expect(first.energyBattPer100km).toBeCloseTo((50 / 150) * 100, 3)
    expect(first.distToNext).toBe(150)
  })

  it('returns null energy consumption when distance is 0, battery did not increase, or battery drop is negative', () => {
    const zeroDistanceRows = [
      row({ id: 'a', start_at: '2026-01-01T08:00:00Z', odometer_km: 1000 }),
      row({ id: 'b', start_at: '2026-01-02T08:00:00Z', odometer_km: 1000 }),
    ]
    expect(deriveSessions(zeroDistanceRows)[0].energyKwhPer100km).toBeNull()

    const noBattIncreaseRows = [
      row({ id: 'a', start_at: '2026-01-01T08:00:00Z', odometer_km: 1000, batt_before_pct: 50, batt_after_pct: 50 }),
      row({ id: 'b', start_at: '2026-01-02T08:00:00Z', odometer_km: 1100, batt_before_pct: 30 }),
    ]
    expect(deriveSessions(noBattIncreaseRows)[0].energyKwhPer100km).toBeNull()

    const negativeBattDropRows = [
      row({ id: 'a', start_at: '2026-01-01T08:00:00Z', odometer_km: 1000, batt_before_pct: 20, batt_after_pct: 80 }),
      row({ id: 'b', start_at: '2026-01-02T08:00:00Z', odometer_km: 1100, batt_before_pct: 90 }), // battDrop = 80-90 = -10
    ]
    expect(deriveSessions(negativeBattDropRows)[0].energyKwhPer100km).toBeNull()
  })

  it('applies the fx_rate_to_sgd multiplier to cost/rebate/idle_fees, and computes cost_per_kwh from gross (not net) cost', () => {
    const [session] = deriveSessions([
      row({ cost: 100, rebate: 10, idle_fees: 5, fx_rate_to_sgd: 0.31847, kwh: 20 }),
    ])
    expect(session.grossCost).toBeCloseTo(31.847, 3)
    expect(session.rebate).toBeCloseTo(3.1847, 3)
    expect(session.idleFees).toBeCloseTo(1.59235, 3)
    expect(session.netCost).toBeCloseTo(31.847 - 3.1847, 3)
    // cost_per_kwh must use gross, never net
    expect(session.costPerKwh).toBeCloseTo(31.847 / 20, 4)
  })
})

describe('deltaPct', () => {
  it('returns "New" when previous is 0 and current is nonzero', () => {
    expect(deltaPct(100, 0)).toEqual({ pct: null, label: 'New', direction: 'neutral' })
  })
  it('returns "N/A" when both are 0', () => {
    expect(deltaPct(0, 0)).toEqual({ pct: null, label: 'N/A', direction: 'neutral' })
  })
  it('computes signed percentage change', () => {
    const result = deltaPct(150, 100)
    expect(result.pct).toBeCloseTo(50, 5)
    expect(result.direction).toBe('up')
  })
})

describe('monthKey / getPrevMonthKey', () => {
  it('formats as YYYY-MM', () => {
    expect(monthKey(new Date(2026, 0, 15))).toBe('2026-01')
  })
  it('wraps year boundaries', () => {
    expect(getPrevMonthKey('2026-01')).toBe('2025-12')
  })
})

describe('computeEnergyConsumptionIQR', () => {
  it('returns null for no valid values', () => {
    const sessions: DerivedSession[] = []
    expect(computeEnergyConsumptionIQR(sessions)).toBeNull()
  })

  it('filters outliers beyond 1.5*IQR before averaging when there are >=4 values', () => {
    const mk = (v: number | null): DerivedSession =>
      ({ energyKwhPer100km: v } as unknown as DerivedSession)
    const sessions = [mk(15), mk(16), mk(14), mk(15.5), mk(500)] // 500 is a wild outlier
    const avg = computeEnergyConsumptionIQR(sessions)
    expect(avg).not.toBeNull()
    expect(avg!).toBeLessThan(20)
  })
})
