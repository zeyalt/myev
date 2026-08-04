export const EXPENSE_CATEGORIES = [
  'Cardcard Auto Top-up',
  'Parking.sg',
  'Maintenance',
  'Monthly Mortgage',
  'Car Wash',
  'Road Tax',
  'Insurance',
  'Other',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export const CURRENCIES = ['SGD', 'MYR'] as const
export type Currency = (typeof CURRENCIES)[number]

export const COUNTRIES = ['Singapore', 'Malaysia'] as const
export type Country = (typeof COUNTRIES)[number]

export const CHARGING_TYPES = ['AC', 'DC'] as const
export type ChargingType = (typeof CHARGING_TYPES)[number]

export const SUBSCRIPTION_PLANS = [
  'None',
  '[Shell Recharge] Eurokars MG 500kWh',
  '[Charge+] Nano 55kWh',
  '[Charge+] Ultra-Lite 125kWh',
  '[Charge+] Lite 190kWh',
  '[Charge+] Regular 360kWh',
  '[Charge+] Plus 480kWh',
  'Other',
] as const
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number]

export const PAID_BY_OPTIONS = ['Zeya & Atiqah', 'Zeya', 'Atiqah'] as const
export type PaidBy = (typeof PAID_BY_OPTIONS)[number]

// Shared across all provider-related charts, matching dashboard.html's providerColors
export const PROVIDER_COLORS = [
  '#00D4FF',
  '#FFB020',
  '#34D399',
  '#FF6B6B',
  '#A78BFA',
  '#38BDF8',
  '#94A3B8',
  '#F472B6',
  '#FACC15',
]

// EV Charging (synthesized) + other expense categories, for the Expenses by Category donut
export const EXPENSE_COLORS = [
  '#00D4FF', // EV Charging
  '#FFB020',
  '#A78BFA',
  '#34D399',
  '#FF6B6B',
  '#38BDF8',
  '#F87171',
  '#6366F1',
  '#FACC15',
]

export const EV_CHARGING_CATEGORY_LABEL = 'EV Charging'
