import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { db } from '../lib/dataApiClient'
import { useChargingSessionsRaw, CHARGING_SESSIONS_RAW_QUERY_KEY } from '../hooks/useChargingSessionsRaw'
import { CHARGING_SESSIONS_QUERY_KEY } from '../hooks/useChargingSessions'
import { useOtherExpenses } from '../hooks/useOtherExpenses'
import RecordsTable from '../components/table/RecordsTable'
import ExpensesRecordsTable from '../components/table/ExpensesRecordsTable'
import EntryForm from '../components/entry/EntryForm'
import EditSessionModal from '../components/entry/EditSessionModal'
import ConfirmDeleteModal from '../components/table/ConfirmDeleteModal'
import type { RecordRow } from '../lib/types'

export default function RecordsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useChargingSessionsRaw()
  const expensesQuery = useOtherExpenses()
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
          <p className="text-sm text-slate mt-1">Every charging session, unfiltered, with raw database fields.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan to-cyan-dim text-void font-semibold text-sm glow-cyan"
        >
          {showAddForm ? 'Close' : '+ Add Entry'}
        </button>
      </div>

      {showAddForm && <EntryForm />}

      {isLoading ? (
        <div className="py-24 text-center text-slate">Loading records…</div>
      ) : isError ? (
        <div className="py-24 text-center text-red">Couldn't load records from Neon.</div>
      ) : (
        <RecordsTable sessions={data ?? []} onEdit={setEditingRecord} onRequestDelete={setDeletingRecord} />
      )}

      {expensesQuery.isLoading ? (
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
