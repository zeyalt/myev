// Subscription-plan helpers: derive a session's cost from the plan's prepaid
// kWh bundle (cost = kwh / planKwh * planPrice) instead of hand-calculating it.
// Plans live in the `subscription_plans` table and are managed in Settings.

export interface SubscriptionPlanDef {
  id?: string
  name: string
  /** Prepaid bundle size; null = unknown. */
  kwh: number | null
  /** Bundle price in SGD; null = unknown (cost auto-calc skipped). */
  priceSgd: number | null
}

/** Names that can't be used for a plan: 'None' is implicit, 'Other' is the dropdown's free-text escape hatch. */
const RESERVED_NAMES = ['none', 'other']

/**
 * Used only when the subscription_plans table can't be read (neon/05 not run
 * yet), so the entry form keeps working with the original plan list.
 */
export const FALLBACK_PLANS: SubscriptionPlanDef[] = [
  { name: '[Shell Recharge] Eurokars MG 500kWh', kwh: 500, priceSgd: null },
  { name: '[Charge+] Nano 55kWh', kwh: 55, priceSgd: null },
  { name: '[Charge+] Ultra-Lite 125kWh', kwh: 125, priceSgd: null },
  { name: '[Charge+] Lite 190kWh', kwh: 190, priceSgd: null },
  { name: '[Charge+] Regular 360kWh', kwh: 360, priceSgd: 193 },
  { name: '[Charge+] Plus 480kWh', kwh: 480, priceSgd: null },
]

/** Bundle size hinted by a plan name, e.g. "[Charge+] Regular 360kWh" -> 360 (prefills the Settings form). */
export function kwhFromName(name: string): number | null {
  const m = name.match(/(\d+(?:\.\d+)?)\s*kWh/i)
  return m ? Number(m[1]) : null
}

export interface SubscriptionCost {
  cost: number
  planKwh: number
  planPrice: number
}

/** Pro-rata cost of `kwh` against the named plan's bundle, rounded to 2dp; null if the plan has no known price/size. */
export function computeSubscriptionCost(
  plans: SubscriptionPlanDef[],
  planName: string,
  kwh: number,
): SubscriptionCost | null {
  const plan = plans.find((p) => p.name === planName)
  if (!plan || plan.priceSgd == null || plan.kwh == null || plan.kwh <= 0) return null
  if (!Number.isFinite(kwh) || kwh < 0) return null
  return { cost: Math.round((kwh / plan.kwh) * plan.priceSgd * 100) / 100, planKwh: plan.kwh, planPrice: plan.priceSgd }
}

/**
 * Validates a plan being added/edited. `kwh`/`price` are the raw input strings
 * ('' = not set). `otherNames` = the names of every *other* plan.
 */
export function validatePlan(name: string, kwh: string, price: string, otherNames: string[]): string | null {
  const n = name.trim()
  if (!n) return 'Name is required'
  if (RESERVED_NAMES.includes(n.toLowerCase())) return `"${n}" is reserved`
  if (otherNames.some((o) => o.trim().toLowerCase() === n.toLowerCase())) return 'A plan with this name already exists'
  if (kwh.trim() !== '' && !(Number(kwh) > 0)) return 'kWh must be greater than 0'
  if (price.trim() !== '' && !(Number(price) >= 0)) return 'Price must be 0 or more'
  return null
}

/**
 * Plan used by the most recent past session at the same location + provider
 * (case-insensitive), falling back to the most recent at that provider.
 * `sessions` must be ordered newest-first. Most-recent (not most-frequent)
 * because subscriptions change over time.
 */
export function inferSubscriptionPlan(
  sessions: { location: string; provider: string; subscription_plan: string }[],
  location: string,
  provider: string,
): string | null {
  const loc = location.trim().toLowerCase()
  const prov = provider.trim().toLowerCase()
  if (!prov) return null
  const forProvider = sessions.filter((s) => s.provider.trim().toLowerCase() === prov)
  const exact = forProvider.find((s) => s.location.trim().toLowerCase() === loc)
  return (exact ?? forProvider[0])?.subscription_plan ?? null
}
