import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { db } from '../../lib/dataApiClient'
import { EXPENSE_CATEGORIES, PAID_BY_OPTIONS } from '../../lib/constants'
import { useDistinctValues } from '../../hooks/useDistinctValues'
import { OTHER_EXPENSES_QUERY_KEY } from '../../hooks/useOtherExpenses'
import FormField, { inputClass } from './FormField'
import type { NewOtherExpenseRow } from '../../lib/types'

const schema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  categoryOther: z.string().optional(),
  expenseDate: z.string().min(1, 'Required'),
  amountSgd: z.coerce.number().min(0, 'Must be >= 0'),
  paymentMethod: z.string().min(1, 'Required'),
  paidBy: z.string().min(1, 'Required'),
})

type FormValues = z.infer<typeof schema>

export default function OtherExpenseEntryForm() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({ type: 'idle' })
  const paymentMethods = useDistinctValues('other_expenses', 'payment_method')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { category: EXPENSE_CATEGORIES[0], paidBy: PAID_BY_OPTIONS[0] },
  })

  const category = watch('category')

  const onBlurRound2dp = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    if (!Number.isFinite(v)) return
    const rounded = Math.round(v * 100) / 100
    if (rounded !== v) setValue('amountSgd', rounded, { shouldValidate: true })
  }

  const onSubmit = handleSubmit(async (values) => {
    setStatus({ type: 'idle' })
    try {
      const resolvedCategory = values.category === 'Other' ? values.categoryOther?.trim() || 'Other' : values.category

      const row: NewOtherExpenseRow = {
        expense_date: values.expenseDate,
        category: resolvedCategory,
        amount_sgd: Math.round(values.amountSgd * 100) / 100,
        payment_method: values.paymentMethod,
        paid_by: values.paidBy,
      }

      const { error } = await db.from('other_expenses').insert(row)
      if (error) throw error

      await queryClient.invalidateQueries({ queryKey: OTHER_EXPENSES_QUERY_KEY })
      setStatus({ type: 'success', message: 'Saved.' })
      reset({ category: EXPENSE_CATEGORIES[0], paidBy: PAID_BY_OPTIONS[0] })
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Failed to save. Please try again.' })
    }
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Expense Category" error={errors.category?.message}>
          <select className={inputClass} {...register('category')}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FormField>

        {category === 'Other' && (
          <FormField label="Specify Category" error={errors.categoryOther?.message}>
            <input type="text" className={inputClass} {...register('categoryOther')} />
          </FormField>
        )}

        <FormField label="Expense Date" error={errors.expenseDate?.message}>
          <input type="date" className={inputClass} {...register('expenseDate')} />
        </FormField>

        <FormField label="Amount Paid (SGD)" error={errors.amountSgd?.message}>
          <input type="number" step="0.01" min="0" className={inputClass} {...register('amountSgd')} onBlur={onBlurRound2dp} />
        </FormField>

        <FormField label="Payment Method" error={errors.paymentMethod?.message}>
          <input type="text" list="payment-method-options" className={inputClass} {...register('paymentMethod')} />
          <datalist id="payment-method-options">
            {(paymentMethods.data ?? []).map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </FormField>

        <FormField label="Paid By" error={errors.paidBy?.message}>
          <select className={inputClass} {...register('paidBy')}>
            {PAID_BY_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {status.type === 'error' && <p className="text-sm text-red">{status.message}</p>}
      {status.type === 'success' && <p className="text-sm text-green">{status.message}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan to-cyan-dim text-void font-semibold text-sm disabled:opacity-50 glow-cyan"
      >
        {isSubmitting ? 'Saving…' : 'Save Expense'}
      </button>
    </form>
  )
}
