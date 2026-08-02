import type { ReactNode } from 'react'
import clsx from 'clsx'

export default function Panel({
  children,
  className,
  title,
  action,
}: {
  children: ReactNode
  className?: string
  title?: string
  action?: ReactNode
}) {
  return (
    <div className={clsx('glass-panel p-5', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
