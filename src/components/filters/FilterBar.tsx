import clsx from 'clsx'
import { useFilterStore } from '../../store/filterStore'
import { COUNTRIES, CHARGING_TYPES } from '../../lib/constants'
import ProviderPills from './ProviderPills'
import Panel from '../ui/Panel'

export default function FilterBar({
  availableMonths,
  availableProviders,
}: {
  availableMonths: string[]
  availableProviders: string[]
}) {
  const { month, country, chargingType, setMonth, setCountry, setChargingType, clearAll, providers, crossFilterProvider } =
    useFilterStore()

  const hasActiveFilters =
    month !== null || country !== 'All' || chargingType !== 'All' || providers.length > 0 || crossFilterProvider !== null

  return (
    <Panel className="!p-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={month ?? ''}
          onChange={(e) => setMonth(e.target.value || null)}
          className="bg-surface border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-white font-mono-nums focus:outline-none focus:border-cyan/50"
        >
          <option value="">All time</option>
          {availableMonths.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <SegmentedControl
          value={country}
          options={['All', ...COUNTRIES]}
          onChange={(v) => setCountry(v as typeof country)}
        />

        <SegmentedControl
          value={chargingType}
          options={['All', ...CHARGING_TYPES]}
          onChange={(v) => setChargingType(v as typeof chargingType)}
        />

        <div className="flex-1 min-w-[200px]">
          <ProviderPills providers={availableProviders} />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-slate hover:text-red transition-colors whitespace-nowrap"
          >
            Clear all
          </button>
        )}
      </div>
    </Panel>
  )
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: readonly T[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border-subtle bg-surface p-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={clsx(
            'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
            value === opt ? 'bg-cyan/15 text-cyan' : 'text-slate hover:text-white',
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
