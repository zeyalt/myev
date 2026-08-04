import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import OfflineBanner from './OfflineBanner'

const navItems = [
  { to: '/records', label: 'Records', icon: RecordsIcon },
  { to: '/', label: 'Dashboard', icon: DashboardIcon },
  { to: '/insights', label: 'Insights', icon: InsightsIcon },
]

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-void/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center h-16">
          <div className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-cyan to-violet flex items-center justify-center glow-cyan">
              <BoltIcon />
            </div>
            <span className="font-display font-semibold text-lg tracking-tight text-white">
              my<span className="text-cyan">ev</span>
            </span>
          </div>
        </div>
      </header>
      <OfflineBanner />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 pb-24">{children}</main>

      <nav
        className="fixed bottom-0 inset-x-0 z-30 border-t border-white/5 bg-void/90 backdrop-blur-xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-stretch justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center gap-1 flex-1 py-2.5 text-[11px] font-medium transition-colors',
                  isActive ? 'text-cyan' : 'text-slate hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon active={isActive} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
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

function RecordsIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
    </svg>
  )
}

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  )
}

function InsightsIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6v.5h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z" />
      <path d="M9.5 19h5M10.5 21.5h3" strokeLinecap="round" />
    </svg>
  )
}
