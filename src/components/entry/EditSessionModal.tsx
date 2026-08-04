import Modal from '../ui/Modal'
import ChargingSessionForm from './ChargingSessionForm'
import type { RecordRow } from '../../lib/types'

export default function EditSessionModal({ record, onClose }: { record: RecordRow; onClose: () => void }) {
  return (
    <Modal title={record.isComplete ? 'Edit Charging Session' : 'Complete Charging Session'} onClose={onClose}>
      <ChargingSessionForm mode="edit" record={record} onDone={onClose} />
    </Modal>
  )
}
