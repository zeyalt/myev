export function fmtCurrency(v: number, dp = 2): string {
  if (!Number.isFinite(v)) return '--'
  return `$${v.toLocaleString('en-SG', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`
}

export function fmtNumber(v: number, dp = 2): string {
  if (!Number.isFinite(v)) return '--'
  return v.toLocaleString('en-SG', { minimumFractionDigits: dp, maximumFractionDigits: dp })
}

export function fmtPct(v: number, dp = 1): string {
  if (!Number.isFinite(v)) return '--'
  return `${v.toLocaleString('en-SG', { minimumFractionDigits: dp, maximumFractionDigits: dp })}%`
}

export function fmtCostPerKwh(v: number): string {
  if (!Number.isFinite(v)) return '--'
  return `$${v.toFixed(4)}`
}
