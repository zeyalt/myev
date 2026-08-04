import { useMemo, useState } from 'react'
import Panel from '../ui/Panel'
import { fmtCurrency } from '../../lib/format'
import type { DerivedExpense } from '../../lib/types'

type SortKey = 'date' | 'category' | 'amountSgd'

const PAGE_SIZE = 20

export default function ExpensesRecordsTable({ expenses }: { expenses: DerivedExpense[] }) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDesc, setSortDesc] = useState(true)
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows = q
      ? expenses.filter(
          (e) =>
            e.category.toLowerCase().includes(q) ||
            e.paymentMethod.toLowerCase().includes(q) ||
            e.paidBy.toLowerCase().includes(q),
        )
      : expenses
    return [...rows].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      const cmp = av instanceof Date && bv instanceof Date ? av.getTime() - bv.getTime() : (av as number) - (bv as number)
      return sortDesc ? -cmp : cmp
    })
  }, [expenses, search, sortKey, sortDesc])

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
      title="All Other Expenses (raw)"
      action={
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          placeholder="Search category, payment method, paid by…"
          className="bg-surface border border-border-subtle rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate/50 focus:outline-none focus:border-cyan/50 w-64"
        />
      }
    >
      {expenses.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate">No expense records yet</div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <Th label="Date" onClick={() => toggleSort('date')} active={sortKey === 'date'} desc={sortDesc} />
                  <Th label="Category" onClick={() => toggleSort('category')} active={sortKey === 'category'} desc={sortDesc} />
                  <Th label="Amount (SGD)" onClick={() => toggleSort('amountSgd')} active={sortKey === 'amountSgd'} desc={sortDesc} />
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-slate uppercase tracking-wider whitespace-nowrap">
                    Payment Method
                  </th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-slate uppercase tracking-wider whitespace-nowrap">
                    Paid By
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((e) => (
                  <tr key={e.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-4 py-2 whitespace-nowrap font-mono-nums text-slate">
                      {e.date.toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-white">{e.category}</td>
                    <td className="px-4 py-2 whitespace-nowrap font-mono-nums text-slate">{fmtCurrency(e.amountSgd)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-slate">{e.paymentMethod}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-slate">{e.paidBy}</td>
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
