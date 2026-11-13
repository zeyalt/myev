import { useState } from 'react'
import clsx from 'clsx'
import { useQueryClient } from '@tanstack/react-query'
import { db } from '../lib/dataApiClient'
import { useChargingSessionsRaw, CHARGING_SESSIONS_RAW_QUERY_KEY } from '../hooks/useChargingSessionsRaw'
import { CHARGING_SESSIONS_QUERY_KEY } from '../hooks/useChargingSessions'
import { useOtherExpenses } from '../hooks/useOtherExpenses'
import RecordsTable from '../components/table/RecordsTable'
import ExpensesRecordsTable from '../components/table/ExpensesRecordsTable'
import EntryForm, { type Branch } from '../components/entry/EntryForm'
import EditSessionModal from '../components/entry/EditSessionModal'
import ConfirmDeleteModal from '../components/table/ConfirmDeleteModal'
import type { RecordRow } from '../lib/types'

export default function RecordsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useChargingSessionsRaw()
  const expensesQuery = useOtherExpenses()
  const [tab, setTab] = useState<Branch>('Charging-Related')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<RecordRow | null>(null)
  const [deletingRecord, setDeletingRecord] = useState<RecordRow | null>(null)

  const handleConfirmDelete = async () => {
    if (!deletingRecord) return
    const { error } = await db.from('charging_sessions').delete().eq('id', deletingRecord.id)
    if (error) {
      window.alert(`Failed to delete: ${error.message}`)
      return
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: CHARGING_SESSIONS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: CHARGING_SESSIONS_RAW_QUERY_KEY }),
    ])
    setDeletingRecord(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Records</h1>
          <p className="text-sm text-slate mt-1">
            {tab === 'Charging-Related'
              ? 'Every charging session, unfiltered, with raw database fields.'
              : 'Every non-charging expense.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan to-cyan-dim text-void font-semibold text-sm glow-cyan"
        >
          {showAddForm ? 'Close' : '+ Add Entry'}
        </button>
      </div>

      <div role="tablist" className="flex items-center gap-0.5 rounded-lg border border-border-subtle bg-surface p-0.5">
        {(['Charging-Related', 'Other Expenses'] as Branch[]).map((b) => (
          <button
            key={b}
            type="button"
            role="tab"
            aria-selected={tab === b}
            onClick={() => {
              setTab(b)
              setShowAddForm(false)
            }}
            className={clsx(
              'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors text-center',
              tab === b ? 'bg-cyan/15 text-cyan' : 'text-slate hover:text-white',
            )}
          >
            {b}
          </button>
        ))}
      </div>

      {showAddForm && <EntryForm branch={tab} />}

      {tab === 'Charging-Related' ? (
        isLoading ? (
          <div className="py-24 text-center text-slate">Loading records…</div>
        ) : isError ? (
          <div className="py-24 text-center text-red">Couldn't load records from Neon.</div>
        ) : (
          <RecordsTable sessions={data ?? []} onEdit={setEditingRecord} onRequestDelete={setDeletingRecord} />
        )
      ) : expensesQuery.isLoading ? (
        <div className="py-24 text-center text-slate">Loading expenses…</div>
      ) : expensesQuery.isError ? (
        <div className="py-24 text-center text-red">Couldn't load expenses from Neon.</div>
      ) : (
        <ExpensesRecordsTable expenses={expensesQuery.data ?? []} />
      )}

      {editingRecord && <EditSessionModal record={editingRecord} onClose={() => setEditingRecord(null)} />}
      {deletingRecord && (
        <ConfirmDeleteModal record={deletingRecord} onConfirm={handleConfirmDelete} onCancel={() => setDeletingRecord(null)} />
      )}
    </div>
  )
}
