// Historical MYR->SGD FX rate lookup, used at charging-entry submission time.
// Frankfurter (https://www.frankfurter.app) is a free, no-API-key, ECB-sourced
// historical rate service. Results are cached in localStorage by date so repeat
// entries for the same day (or offline retries) don't re-hit the network.

export type FxRateSource = 'api' | 'cached_fallback' | 'fixed_fallback'

export interface FxResult {
  rate: number
  source: FxRateSource
}

const FIXED_FALLBACK_RATE = 1 / 3.14
const LS_LAST_RATE_KEY = 'myev:lastKnownMyrToSgdRate'
const LS_DATE_CACHE_PREFIX = 'myev:fxRate:MYR:SGD:'

function dateCacheKey(dateISO: string) {
  return `${LS_DATE_CACHE_PREFIX}${dateISO}`
}

function readCachedRateForDate(dateISO: string): number | null {
  const raw = localStorage.getItem(dateCacheKey(dateISO))
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function writeCachedRateForDate(dateISO: string, rate: number) {
  localStorage.setItem(dateCacheKey(dateISO), String(rate))
  localStorage.setItem(LS_LAST_RATE_KEY, String(rate))
}

function readLastKnownRate(): number | null {
  const raw = localStorage.getItem(LS_LAST_RATE_KEY)
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

/**
 * Resolves the MYR->SGD rate for a given date (YYYY-MM-DD).
 * Fallback chain: per-date cache -> live API -> last known rate -> fixed 1/3.14.
 */
export async function getHistoricalFxRate(dateISO: string): Promise<FxResult> {
  const cached = readCachedRateForDate(dateISO)
  if (cached !== null) {
    return { rate: cached, source: 'api' }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(`https://api.frankfurter.app/${dateISO}?from=MYR&to=SGD`, {
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`Frankfurter API error: ${res.status}`)
    const data = (await res.json()) as { rates?: { SGD?: number } }
    const rate = data.rates?.SGD
    if (typeof rate !== 'number' || !Number.isFinite(rate)) throw new Error('Malformed FX response')
    writeCachedRateForDate(dateISO, rate)
    return { rate, source: 'api' }
  } catch {
    const lastKnown = readLastKnownRate()
    if (lastKnown !== null) {
      return { rate: lastKnown, source: 'cached_fallback' }
    }
    return { rate: FIXED_FALLBACK_RATE, source: 'fixed_fallback' }
  }
}
