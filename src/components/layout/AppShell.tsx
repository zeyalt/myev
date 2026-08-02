import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import OfflineBanner from './OfflineBanner'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/add', label: 'Add Entry' },
  { to: '/insights', label: 'Insights' },
]

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-void/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-cyan to-violet flex items-center justify-center glow-cyan">
              <BoltIcon />
            </div>
            <span className="font-display font-semibold text-lg tracking-tight text-white">
              my<span className="text-cyan">ev</span>
            </span>
          </div>
          <nav className="flex items-center gap-1 rounded-full border border-border-subtle bg-surface/60 p-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  clsx(
                    'px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors',
                    isActive ? 'bg-cyan/15 text-cyan' : 'text-slate hover:text-white',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <OfflineBanner />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6">{children}</main>
      <footer className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 text-xs text-slate/60 font-mono-nums">
        myev — EV charging analytics
      </footer>
    </div>
  )
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5 text-void" strokeWidth={0}>
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" fill="currentColor" className="text-void" />
    </svg>
  )
}
