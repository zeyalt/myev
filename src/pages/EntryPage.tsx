import EntryForm from '../components/entry/EntryForm'

export default function EntryPage() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Add Entry</h1>
        <p className="text-sm text-slate mt-1">Log a charging session or another EV-related expense.</p>
      </div>
      <EntryForm />
    </div>
  )
}
