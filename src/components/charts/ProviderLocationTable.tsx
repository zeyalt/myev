import { useMemo, useState } from 'react'
import Panel from '../ui/Panel'
import { fmtCurrency, fmtNumber, fmtCostPerKwh } from '../../lib/format'
import type { DerivedSession } from '../../lib/types'

interface Row {
  provider: string
  location: string
  sessions: number
  totalKwh: number
  avgCostPerKwh: number
  avgSpeed: number
  avgBatteryRate: number
  totalSpend: number
}

type SortKey = keyof Row

export default function ProviderLocationTable({ sessions }: { sessions: DerivedSession[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('totalSpend')
  const [sortDesc, setSortDesc] = useState(true)

  const rows = useMemo(() => {
    const map = new Map<string, DerivedSession[]>()
    for (const s of sessions) {
      const key = `${s.provider}|||${s.location}`
      const arr = map.get(key) ?? []
      arr.push(s)
      map.set(key, arr)
    }
    const out: Row[] = []
    for (const [key, group] of map) {
      const [provider, location] = key.split('|||')
      const totalKwh = group.reduce((sum, s) => sum + s.kwh, 0)
      const totalSpend = group.reduce((sum, s) => sum + s.grossCost, 0)
      out.push({
        provider,
        location,
        sessions: group.length,
        totalKwh,
        avgCostPerKwh: totalKwh > 0 ? totalSpend / totalKwh : 0,
        avgSpeed: avg(group.map((s) => s.chargingSpeedKwhPerHour)),
        avgBatteryRate: avg(group.map((s) => s.batteryIncreaseRatePerHour)),
        totalSpend,
      })
    }
    return out.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
      return sortDesc ? -cmp : cmp
    })
  }, [sessions, sortKey, sortDesc])

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDesc((d) => !d)
    else {
      setSortKey(key)
      setSortDesc(true)
    }
  }

  const columns: { key: SortKey; label: string }[] = [
    { key: 'provider', label: 'Provider' },
    { key: 'location', label: 'Location' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'totalKwh', label: 'Total kWh' },
    { key: 'avgCostPerKwh', label: 'Avg $/kWh' },
    { key: 'avgSpeed', label: 'Avg Speed (kWh/h)' },
    { key: 'avgBatteryRate', label: 'Avg Batt %/h' },
    { key: 'totalSpend', label: 'Total Spend' },
  ]

  return (
    <Panel title="Provider × Location Metrics">
      {rows.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate">No data for this period</div>
      ) : (
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                {columns.map((c) => (
                  <th
                    key={c.key}
                    onClick={() => toggleSort(c.key)}
                    className="text-left px-5 py-2 text-[11px] font-medium text-slate uppercase tracking-wider cursor-pointer hover:text-white whitespace-nowrap select-none"
                  >
                    {c.label} {sortKey === c.key && (sortDesc ? '↓' : '↑')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.provider}|${r.location}`} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-5 py-2 font-medium text-white whitespace-nowrap">{r.provider}</td>
                  <td className="px-5 py-2 text-slate whitespace-nowrap">{r.location}</td>
                  <td className="px-5 py-2 font-mono-nums">{r.sessions}</td>
                  <td className="px-5 py-2 font-mono-nums">{fmtNumber(r.totalKwh, 1)}</td>
                  <td className="px-5 py-2 font-mono-nums text-cyan">{fmtCostPerKwh(r.avgCostPerKwh)}</td>
                  <td className="px-5 py-2 font-mono-nums">{fmtNumber(r.avgSpeed, 2)}</td>
                  <td className="px-5 py-2 font-mono-nums">{fmtNumber(r.avgBatteryRate, 1)}</td>
                  <td className="px-5 py-2 font-mono-nums">{fmtCurrency(r.totalSpend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}

function avg(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}
