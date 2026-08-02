import clsx from 'clsx'
import { useFilterStore } from '../../store/filterStore'

export default function ProviderPills({ providers }: { providers: string[] }) {
  const { providers: selected, toggleProvider } = useFilterStore()

  if (providers.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {providers.map((p) => {
        const active = selected.includes(p)
        return (
          <button
            key={p}
            type="button"
            onClick={() => toggleProvider(p)}
            className={clsx(
              'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
              active
                ? 'bg-cyan/15 border-cyan/40 text-cyan'
                : 'bg-surface border-border-subtle text-slate hover:border-cyan/30 hover:text-white',
            )}
          >
            {p}
          </button>
        )
      })}
    </div>
  )
}
