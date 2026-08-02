import { useMemo, useState } from 'react'
import Panel from '../ui/Panel'
import { fmtCurrency, fmtNumber, fmtCostPerKwh } from '../../lib/format'
import type { DerivedSession } from '../../lib/types'

type SortKey = 'startAt' | 'provider' | 'location' | 'kwh' | 'costPerKwh' | 'grossCost' | 'netCost'

const PAGE_SIZE = 15

export default function SessionsTable({ sessions }: { sessions: DerivedSession[] }) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('startAt')
  const [sortDesc, setSortDesc] = useState(true)
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows = q
      ? sessions.filter((s) => s.location.toLowerCase().includes(q) || s.provider.toLowerCase().includes(q))
      : sessions
    return [...rows].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      const cmp = av instanceof Date && bv instanceof Date ? av.getTime() - bv.getTime() : (av as number) - (bv as number)
      return sortDesc ? -cmp : cmp
    })
  }, [sessions, search, sortKey, sortDesc])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDesc((d) => !d)
    else {
      setSortKey(key)
      setSortDesc(true)
    }
    setPage(0)
  }

  return (
    <Panel
      title="Charging Sessions"
      action={
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          placeholder="Search location or provider…"
          className="bg-surface border border-border-subtle rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate/50 focus:outline-none focus:border-cyan/50 w-56"
        />
      }
    >
      {sessions.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate">No data for this period</div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <Th label="Date" onClick={() => toggleSort('startAt')} active={sortKey === 'startAt'} desc={sortDesc} />
                  <Th label="Location" onClick={() => toggleSort('location')} active={sortKey === 'location'} desc={sortDesc} />
                  <Th label="Provider" onClick={() => toggleSort('provider')} active={sortKey === 'provider'} desc={sortDesc} />
                  <th className="text-left px-5 py-2 text-[11px] font-medium text-slate uppercase tracking-wider">Country</th>
                  <th className="text-left px-5 py-2 text-[11px] font-medium text-slate uppercase tracking-wider">Type</th>
                  <Th label="kWh" onClick={() => toggleSort('kwh')} active={sortKey === 'kwh'} desc={sortDesc} />
                  <th className="text-left px-5 py-2 text-[11px] font-medium text-slate uppercase tracking-wider">Duration</th>
                  <th className="text-left px-5 py-2 text-[11px] font-medium text-slate uppercase tracking-wider">Speed (kWh/h)</th>
                  <th className="text-left px-5 py-2 text-[11px] font-medium text-slate uppercase tracking-wider">Batt %</th>
                  <Th label="$/kWh" onClick={() => toggleSort('costPerKwh')} active={sortKey === 'costPerKwh'} desc={sortDesc} />
                  <Th label="Gross" onClick={() => toggleSort('grossCost')} active={sortKey === 'grossCost'} desc={sortDesc} />
                  <Th label="Net" onClick={() => toggleSort('netCost')} active={sortKey === 'netCost'} desc={sortDesc} />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((s) => (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-5 py-2 font-mono-nums whitespace-nowrap">
                      {s.startAt.toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-5 py-2 text-white whitespace-nowrap">{s.location}</td>
                    <td className="px-5 py-2 text-slate whitespace-nowrap">{s.provider}</td>
                    <td className="px-5 py-2 text-slate whitespace-nowrap">{s.country}</td>
                    <td className="px-5 py-2 text-slate whitespace-nowrap">{s.chargingType}</td>
                    <td className="px-5 py-2 font-mono-nums">{fmtNumber(s.kwh, 2)}</td>
                    <td className="px-5 py-2 font-mono-nums whitespace-nowrap">{fmtNumber(s.durationHours, 2)}h</td>
                    <td className="px-5 py-2 font-mono-nums">{fmtNumber(s.chargingSpeedKwhPerHour, 2)}</td>
                    <td className="px-5 py-2 font-mono-nums whitespace-nowrap">
                      {s.battBefore}% → {s.battAfter}%
                    </td>
                    <td className="px-5 py-2 font-mono-nums text-cyan">{fmtCostPerKwh(s.costPerKwh)}</td>
                    <td className="px-5 py-2 font-mono-nums">{fmtCurrency(s.grossCost)}</td>
                    <td className="px-5 py-2 font-mono-nums">{fmtCurrency(s.netCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between pt-4 text-xs text-slate">
            <span>
              {filtered.length} session{filtered.length === 1 ? '' : 's'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="px-2.5 py-1 rounded-md border border-border-subtle disabled:opacity-30 hover:text-white"
              >
                Prev
              </button>
              <span className="font-mono-nums">
                {page + 1} / {pageCount}
              </span>
              <button
                type="button"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 rounded-md border border-border-subtle disabled:opacity-30 hover:text-white"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </Panel>
  )
}

function Th({ label, onClick, active, desc }: { label: string; onClick: () => void; active: boolean; desc: boolean }) {
  return (
    <th
      onClick={onClick}
      className="text-left px-5 py-2 text-[11px] font-medium text-slate uppercase tracking-wider cursor-pointer hover:text-white whitespace-nowrap select-none"
    >
      {label} {active && (desc ? '↓' : '↑')}
    </th>
  )
}
