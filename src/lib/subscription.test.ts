import { describe, it, expect } from 'vitest'
import { kwhFromName, computeSubscriptionCost, inferSubscriptionPlan, validatePlan, type SubscriptionPlanDef } from './subscription'

const plans: SubscriptionPlanDef[] = [
  { name: '[Charge+] Regular 360kWh', kwh: 360, priceSgd: 193 },
  { name: '[Charge+] Lite 190kWh', kwh: 190, priceSgd: null },
]

describe('kwhFromName', () => {
  it('parses the bundle size hinted by the plan name', () => {
    expect(kwhFromName('[Charge+] Regular 360kWh')).toBe(360)
    expect(kwhFromName('Custom 12.5 kWh')).toBe(12.5)
  })
  it('returns null when there is no size', () => {
    expect(kwhFromName('None')).toBeNull()
  })
})

describe('computeSubscriptionCost', () => {
  it('matches the worked example: 50kWh of a 360kWh/$193 plan', () => {
    expect(computeSubscriptionCost(plans, '[Charge+] Regular 360kWh', 50)).toEqual({ cost: 26.81, planKwh: 360, planPrice: 193 })
  })
  it('is null for plans without a price, unknown plans, or bad kWh', () => {
    expect(computeSubscriptionCost(plans, '[Charge+] Lite 190kWh', 50)).toBeNull()
    expect(computeSubscriptionCost(plans, 'None', 50)).toBeNull()
    expect(computeSubscriptionCost(plans, '[Charge+] Regular 360kWh', NaN)).toBeNull()
  })
  it('uses edited prices, not hard-coded ones', () => {
    const edited = [{ name: 'P', kwh: 100, priceSgd: 50 }]
    expect(computeSubscriptionCost(edited, 'P', 10)?.cost).toBe(5)
  })
})

describe('validatePlan', () => {
  const others = ['[Charge+] Lite 190kWh']
  it('accepts a valid plan, with kWh/price optional', () => {
    expect(validatePlan('New Plan', '100', '50', others)).toBeNull()
    expect(validatePlan('New Plan', '', '', others)).toBeNull()
  })
  it('rejects empty, reserved, duplicate (case-insensitive) and bad numbers', () => {
    expect(validatePlan('  ', '', '', others)).toMatch(/required/)
    expect(validatePlan('none', '', '', others)).toMatch(/reserved/)
    expect(validatePlan('OTHER', '', '', others)).toMatch(/reserved/)
    expect(validatePlan('[charge+] lite 190kwh', '', '', others)).toMatch(/already exists/)
    expect(validatePlan('X', '0', '', others)).toMatch(/kWh/)
    expect(validatePlan('X', '', '-1', others)).toMatch(/Price/)
  })
})

describe('inferSubscriptionPlan', () => {
  const sessions = [
    { location: 'Mall A', provider: 'Charge+', subscription_plan: 'Plan New' },
    { location: 'Mall B', provider: 'Charge+', subscription_plan: 'Plan Old' },
    { location: 'Mall A', provider: 'Other', subscription_plan: 'None' },
  ]
  it('prefers the newest session at the same location + provider (case-insensitive)', () => {
    expect(inferSubscriptionPlan(sessions, 'mall b', 'CHARGE+')).toBe('Plan Old')
    expect(inferSubscriptionPlan(sessions, 'Mall A', 'Charge+')).toBe('Plan New')
  })
  it('falls back to the newest at the provider, then null', () => {
    expect(inferSubscriptionPlan(sessions, 'Mall C', 'Charge+')).toBe('Plan New')
    expect(inferSubscriptionPlan(sessions, 'Mall A', 'Unknown')).toBeNull()
  })
})
