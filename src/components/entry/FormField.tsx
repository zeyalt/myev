import type { ReactNode } from 'react'

export default function FormField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate">{label}</span>
      {children}
      {error && <span className="text-xs text-red">{error}</span>}
    </label>
  )
}

export const inputClass =
  'bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate/40 focus:outline-none focus:border-cyan/50 transition-colors'
