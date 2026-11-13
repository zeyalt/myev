import Panel from '../ui/Panel'
import ChargingSessionForm from './ChargingSessionForm'
import OtherExpenseEntryForm from './OtherExpenseEntryForm'

export type Branch = 'Charging-Related' | 'Other Expenses'

/** Entry form for whichever Records tab is active (the tab, not the form, picks the branch). */
export default function EntryForm({ branch }: { branch: Branch }) {
  return (
    <Panel>{branch === 'Charging-Related' ? <ChargingSessionForm mode="create" /> : <OtherExpenseEntryForm />}</Panel>
  )
}
