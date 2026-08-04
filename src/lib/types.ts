import type { Country, Currency, ChargingType } from './constants'
import type { FxRateSource } from './fx'

// Raw row shapes, matching neon/01_tables.sql (+ neon/0{3,4}_*.sql migrations) exactly.

// Charging sessions are entered in two phases: a "quick start" row with only
// what's known before charging begins, completed/edited later. Fields not
// knowable up front are nullable — see neon/04_editable_sessions.sql.
export interface ChargingSessionRow {
  id: string
  created_at: string
  start_at: string
  end_at: string | null
  idle_start_at: string | null
  idle_end_at: string | null
  kwh: number | null
  odometer_km: number
  batt_before_pct: number
  batt_after_pct: number | null
  cost: number | null
  rebate: number
  idle_fees: number
  currency: Currency | null
  fx_rate_to_sgd: number
  fx_rate_source: FxRateSource
  country: Country
  charging_type: ChargingType
  location: string
  provider: string
  subscription_plan: string
  paid_by: string | null
}

export type NewChargingSessionRow = Omit<ChargingSessionRow, 'id' | 'created_at'>
export type UpdateChargingSessionRow = Partial<NewChargingSessionRow>

/** A ChargingSessionRow with every derivation-relevant field confirmed non-null. */
export type CompleteChargingSessionRow = ChargingSessionRow & {
  end_at: string
  kwh: number
  batt_after_pct: number
  cost: number
  currency: Currency
  paid_by: string
}

/** True once every field needed for cost/energy derivation is present. */
export function isCompleteSession(r: ChargingSessionRow): r is CompleteChargingSessionRow {
  return (
    r.end_at !== null &&
    r.kwh !== null &&
    r.batt_after_pct !== null &&
    r.cost !== null &&
    r.currency !== null &&
    r.paid_by !== null
  )
}

export interface OtherExpenseRow {
  id: string
  created_at: string
  expense_date: string
  category: string
  amount_sgd: number
  payment_method: string
  paid_by: string
}

export type NewOtherExpenseRow = Omit<OtherExpenseRow, 'id' | 'created_at'>

// Derived shapes, computed by src/lib/derive.ts. All UI components consume these,
// never the raw rows above.

export interface DerivedSession {
  id: string
  startAt: Date
  endAt: Date
  idleStartAt: Date | null
  idleEndAt: Date | null
  durationHours: number
  kwh: number
  odometerKm: number
  battBefore: number
  battAfter: number
  grossCost: number
  rebate: number
  idleFees: number
  netCost: number
  costPerKwh: number
  chargingSpeedKwhPerHour: number
  batteryIncreaseRatePerHour: number
  distance: number
  energyKwhPer100km: number | null
  energyBattPer100km: number | null
  distToNext: number | null
  country: Country
  chargingType: ChargingType
  location: string
  provider: string
  subscriptionPlan: string
  paidBy: string
  currency: Currency
  monthKey: string
  // Raw (pre-SGD-conversion) fields, for the Records page's true-raw view.
  rawCost: number
  rawRebate: number
  rawIdleFees: number
  fxRateToSgd: number
  fxRateSource: string
}

// Row shape for the Records page: preserves EVERY session, including
// in-progress ("quick start") ones that DerivedSession/deriveSessions would
// exclude, with nullable fields wherever the underlying data is unknown.
export interface RecordRow {
  id: string
  isComplete: boolean
  startAt: Date
  endAt: Date | null
  idleStartAt: Date | null
  idleEndAt: Date | null
  kwh: number | null
  odometerKm: number
  battBefore: number
  battAfter: number | null
  currency: Currency | null
  rawCost: number | null
  rawRebate: number
  rawIdleFees: number
  fxRateToSgd: number
  fxRateSource: string
  grossCost: number | null
  netCost: number | null
  costPerKwh: number | null
  country: Country
  chargingType: ChargingType
  location: string
  provider: string
  subscriptionPlan: string
  paidBy: string | null
}

export interface DerivedExpense {
  id: string
  date: Date
  category: string
  amountSgd: number
  paymentMethod: string
  paidBy: string
  monthKey: string
}
