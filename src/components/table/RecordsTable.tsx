import { useMemo, useState, type ReactNode } from 'react'
import Panel from '../ui/Panel'
import { fmtNumber, fmtCostPerKwh } from '../../lib/format'
import type { RecordRow } from '../../lib/types'

type SortKey = 'startAt' | 'provider' | 'location' | 'kwh' | 'grossCost'

const PAGE_SIZE = 20

function fmtDateTime(d: Date | null): string {
  if (!d) return '—'
  return d.toLocaleString('en-SG', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function fmtOrDash(v: number | null, dp = 2): string {
  return v === null ? '—' : fmtNumber(v, dp)
}

export default function RecordsTable({
  sessions,
  onEdit,
  onRequestDelete,
}: {
  sessions: RecordRow[]
  onEdit: (record: RecordRow) => void
  onRequestDelete: (record: RecordRow) => void
}) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('startAt')
  const [sortDesc, setSortDesc] = useState(true)
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows = q
      ? sessions.filter(
          (s) =>
            s.location.toLowerCase().includes(q) ||
            s.provider.toLowerCase().includes(q) ||
            (s.paidBy ?? '').toLowerCase().includes(q) ||
            s.subscriptionPlan.toLowerCase().includes(q),
        )
      : sessions
    return [...rows].sort((a, b) => {
      const av = sortKey === 'grossCost' ? (a.grossCost ?? -Infinity) : sortKey === 'kwh' ? (a.kwh ?? -Infinity) : a[sortKey]
      const bv = sortKey === 'grossCost' ? (b.grossCost ?? -Infinity) : sortKey === 'kwh' ? (b.kwh ?? -Infinity) : b[sortKey]
      const cmp = av instanceof Date && bv instanceof Date ? av.getTime() - bv.getTime() : (av as number) - (bv as number)
      return sortDesc ? -cmp : cmp
    })
  }, [sessions, search, sortKey, sortDesc])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const inProgressCount = sessions.filter((s) => !s.isComplete).length

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
      title="All Charging Records (raw)"
      action={
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          placeholder="Search location, provider, paid by, plan…"
          className="bg-surface border border-border-subtle rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate/50 focus:outline-none focus:border-cyan/50 w-64"
        />
      }
    >
      {sessions.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate">No charging records yet</div>
      ) : (
        <>
          {inProgressCount > 0 && (
            <p className="text-xs text-amber mb-3">
              {inProgressCount} session{inProgressCount === 1 ? '' : 's'} in progress — click the pencil to complete once
              charging ends.
            </p>
          )}
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <Col />
                  <Th label="Start" onClick={() => toggleSort('startAt')} active={sortKey === 'startAt'} desc={sortDesc} />
                  <Col>End</Col>
                  <Col>Idle Start</Col>
                  <Col>Idle End</Col>
                  <Th label="Location" onClick={() => toggleSort('location')} active={sortKey === 'location'} desc={sortDesc} />
                  <Th label="Provider" onClick={() => toggleSort('provider')} active={sortKey === 'provider'} desc={sortDesc} />
                  <Col>Country</Col>
                  <Col>Type</Col>
                  <Th label="kWh" onClick={() => toggleSort('kwh')} active={sortKey === 'kwh'} desc={sortDesc} />
                  <Col>Odometer</Col>
                  <Col>Batt %</Col>
                  <Col>Currency</Col>
                  <Col>Raw Cost</Col>
                  <Col>Raw Rebate</Col>
                  <Col>Raw Idle Fees</Col>
                  <Col>FX Rate</Col>
                  <Col>FX Source</Col>
                  <Th label="Gross (SGD)" onClick={() => toggleSort('grossCost')} active={sortKey === 'grossCost'} desc={sortDesc} />
                  <Col>Net (SGD)</Col>
                  <Col>$/kWh</Col>
                  <Col>Subscription Plan</Col>
                  <Col>Paid By</Col>
                  <Col />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((s) => (
                  <tr key={s.id} className={`border-b border-white/5 hover:bg-white/[0.03] ${!s.isComplete ? 'bg-amber/[0.04]' : ''}`}>
                    <Td>
                      <button
                        type="button"
                        onClick={() => onEdit(s)}
                        title={s.isComplete ? 'Edit session' : 'Complete session'}
                        className="text-slate hover:text-cyan transition-colors"
                      >
                        ✎
                      </button>
                    </Td>
                    <Td>
                      {fmtDateTime(s.startAt)}
                      {!s.isComplete && (
                        <span className="ml-1.5 text-[10px] font-semibold text-amber bg-amber/10 px-1.5 py-0.5 rounded-full align-middle">
                          IN PROGRESS
                        </span>
                      )}
                    </Td>
                    <Td>{fmtDateTime(s.endAt)}</Td>
                    <Td>{fmtDateTime(s.idleStartAt)}</Td>
                    <Td>{fmtDateTime(s.idleEndAt)}</Td>
                    <Td className="text-white">{s.location}</Td>
                    <Td className="text-white">{s.provider}</Td>
                    <Td>{s.country}</Td>
                    <Td>{s.chargingType}</Td>
                    <Td mono>{fmtOrDash(s.kwh, 3)}</Td>
                    <Td mono>{fmtNumber(s.odometerKm, 1)}</Td>
                    <Td mono>
                      {s.battBefore}% → {s.battAfter === null ? '—' : `${s.battAfter}%`}
                    </Td>
                    <Td>{s.currency ?? '—'}</Td>
                    <Td mono>{fmtOrDash(s.rawCost, 2)}</Td>
                    <Td mono>{fmtNumber(s.rawRebate, 2)}</Td>
                    <Td mono>{fmtNumber(s.rawIdleFees, 2)}</Td>
                    <Td mono>{fmtNumber(s.fxRateToSgd, 5)}</Td>
                    <Td>{s.fxRateSource}</Td>
                    <Td mono>{s.grossCost === null ? '—' : `$${fmtNumber(s.grossCost, 2)}`}</Td>
                    <Td mono>{s.netCost === null ? '—' : `$${fmtNumber(s.netCost, 2)}`}</Td>
                    <Td mono className="text-cyan">
                      {s.costPerKwh === null ? '—' : fmtCostPerKwh(s.costPerKwh)}
                    </Td>
                    <Td>{s.subscriptionPlan}</Td>
                    <Td>{s.paidBy ?? '—'}</Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => onRequestDelete(s)}
                        title="Delete session"
                        className="text-slate hover:text-red transition-colors"
                      >
                        ✕
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between pt-4 text-xs text-slate">
            <span>
              {filtered.length} record{filtered.length === 1 ? '' : 's'}
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
      className="text-left px-4 py-2 text-[11px] font-medium text-slate uppercase tracking-wider cursor-pointer hover:text-white whitespace-nowrap select-none"
    >
      {label} {active && (desc ? '↓' : '↑')}
    </th>
  )
}

function Col({ children }: { children?: ReactNode }) {
  return <th className="text-left px-4 py-2 text-[11px] font-medium text-slate uppercase tracking-wider whitespace-nowrap">{children}</th>
}

function Td({ children, mono, className }: { children: ReactNode; mono?: boolean; className?: string }) {
  return <td className={`px-4 py-2 whitespace-nowrap ${mono ? 'font-mono-nums' : ''} ${className ?? 'text-slate'}`}>{children}</td>
}
