import { useState } from 'react'
import Modal from '../ui/Modal'
import type { RecordRow } from '../../lib/types'

const CONFIRM_WORD = 'delete'

export default function ConfirmDeleteModal({
  record,
  onConfirm,
  onCancel,
}: {
  record: RecordRow
  onConfirm: () => void
  onCancel: () => void
}) {
  const [typed, setTyped] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const canConfirm = typed.trim().toLowerCase() === CONFIRM_WORD

  const label = record.startAt.toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: '2-digit' })

  const handleConfirm = async () => {
    if (!canConfirm) return
    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal title="Delete Charging Session" onClose={onCancel}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate">
          You're about to permanently delete the session on <span className="text-white font-medium">{label}</span> at{' '}
          <span className="text-white font-medium">{record.location}</span>
          {record.provider ? ` (${record.provider})` : ''}. This cannot be undone.
        </p>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate">
            Type <span className="text-red font-semibold">delete</span> to confirm
          </span>
          <input
            autoFocus
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canConfirm) handleConfirm()
            }}
            placeholder="delete"
            className="bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate/40 focus:outline-none focus:border-red/50"
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || isDeleting}
            className="px-4 py-2 rounded-lg bg-red text-void font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting…' : 'Delete Session'}
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-slate hover:text-white">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}
