import { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import Panel from '../ui/Panel'
import { categoryTotals } from '../../lib/aggregate'
import { EXPENSE_COLORS, EV_CHARGING_CATEGORY_LABEL } from '../../lib/constants'
import { fmtCurrency } from '../../lib/format'
import { tooltipOpts, legendOpts, chartAnimOpts, makeCenterTextPlugin } from './chartTheme'
import type { DerivedSession, DerivedExpense } from '../../lib/types'

export default function ExpensesByCategoryDonut({
  sessions,
  expenses,
}: {
  sessions: DerivedSession[]
  expenses: DerivedExpense[]
}) {
  const rows = useMemo(() => categoryTotals(sessions, expenses, EV_CHARGING_CATEGORY_LABEL), [sessions, expenses])
  const total = rows.reduce((sum, r) => sum + r.amount, 0)

  const data = {
    labels: rows.map((r) => r.category),
    datasets: [
      {
        data: rows.map((r) => r.amount),
        backgroundColor: rows.map((_, i) => EXPENSE_COLORS[i % EXPENSE_COLORS.length]),
        borderColor: '#0b0f1a',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  }

  return (
    <Panel title="Expenses by Category">
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="h-64">
          <Doughnut
            data={data}
            options={{
              maintainAspectRatio: false,
              cutout: '68%',
              animation: chartAnimOpts,
              plugins: {
                legend: legendOpts,
                tooltip: {
                  ...tooltipOpts,
                  callbacks: {
                    label: (ctx: { label: string; parsed: number }) =>
                      ` ${ctx.label}: ${fmtCurrency(ctx.parsed)}`,
                  },
                },
              },
            }}
            plugins={[makeCenterTextPlugin(() => ({ label: 'Total', value: fmtCurrency(total, 0) }))]}
          />
        </div>
      )}
    </Panel>
  )
}

function EmptyState() {
  return <div className="h-64 flex items-center justify-center text-sm text-slate">No data for this period</div>
}
