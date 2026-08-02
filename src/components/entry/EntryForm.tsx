import { useState } from 'react'
import clsx from 'clsx'
import Panel from '../ui/Panel'
import ChargingEntryForm from './ChargingEntryForm'
import OtherExpenseEntryForm from './OtherExpenseEntryForm'

type Branch = 'Charging-Related' | 'Other Expenses'

export default function EntryForm() {
  const [branch, setBranch] = useState<Branch>('Charging-Related')

  return (
    <Panel>
      <div className="mb-6">
        <span className="text-xs font-medium text-slate mb-2 block">What data do you want to record?</span>
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-border-subtle bg-surface p-0.5">
          {(['Charging-Related', 'Other Expenses'] as Branch[]).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBranch(b)}
              className={clsx(
                'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                branch === b ? 'bg-cyan/15 text-cyan' : 'text-slate hover:text-white',
              )}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
      {branch === 'Charging-Related' ? <ChargingEntryForm /> : <OtherExpenseEntryForm />}
    </Panel>
  )
}
