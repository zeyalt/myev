import type { Country, Currency, ChargingType } from './constants'
import type { FxRateSource } from './fx'

// Raw row shapes, matching supabase/schema.sql exactly.

export interface ChargingSessionRow {
  id: string
  created_at: string
  start_at: string
  end_at: string
  kwh: number
  odometer_km: number
  batt_before_pct: number
  batt_after_pct: number
  cost: number
  rebate: number
  idle_fees: number
  currency: Currency
  fx_rate_to_sgd: number
  fx_rate_source: FxRateSource
  country: Country
  charging_type: ChargingType
  location: string
  provider: string
  subscription_plan: string
  paid_by: string
}

export type NewChargingSessionRow = Omit<ChargingSessionRow, 'id' | 'created_at'>

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
