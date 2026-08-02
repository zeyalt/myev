import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { db } from '../../lib/dataApiClient'
import { getHistoricalFxRate } from '../../lib/fx'
import { CURRENCIES, COUNTRIES, CHARGING_TYPES } from '../../lib/constants'
import { useDistinctValues } from '../../hooks/useDistinctValues'
import { CHARGING_SESSIONS_QUERY_KEY } from '../../hooks/useChargingSessions'
import FormField, { inputClass } from './FormField'
import type { NewChargingSessionRow } from '../../lib/types'

const schema = z
  .object({
    startAt: z.string().min(1, 'Required'),
    endAt: z.string().min(1, 'Required'),
    kwh: z.coerce.number().min(0, 'Must be >= 0'),
    odometerKm: z.coerce.number().min(0, 'Must be >= 0'),
    battBefore: z.coerce.number().min(0).max(100),
    battAfter: z.coerce.number().min(0).max(100),
    cost: z.coerce.number().min(0),
    rebate: z.coerce.number().min(0).default(0),
    idleFees: z.coerce.number().min(0).default(0),
    currency: z.enum(CURRENCIES),
    country: z.enum(COUNTRIES),
    chargingType: z.enum(CHARGING_TYPES),
    location: z.string().min(1, 'Required'),
    provider: z.string().min(1, 'Required'),
    subscriptionPlan: z.string().default('None'),
    paidBy: z.string().min(1, 'Required'),
  })
  .refine((d) => new Date(d.endAt) > new Date(d.startAt), {
    message: 'End time must be after start time',
    path: ['endAt'],
  })
  .refine((d) => d.battAfter >= d.battBefore, {
    message: 'Battery % After must be >= Battery % Before',
    path: ['battAfter'],
  })

type FormValues = z.infer<typeof schema>

export default function ChargingEntryForm() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({ type: 'idle' })
  const locations = useDistinctValues('charging_sessions', 'location')
  const providers = useDistinctValues('charging_sessions', 'provider')
  const paidBys = useDistinctValues('charging_sessions', 'paid_by')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    // zod's z.coerce.number() makes the resolver's input type technically
    // `unknown` pre-coercion; the runtime behavior (string input -> number
    // output) is correct, this is purely a resolver/RHF generic mismatch.
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      currency: 'SGD',
      country: 'Singapore',
      chargingType: 'AC',
      subscriptionPlan: 'None',
      rebate: 0,
      idleFees: 0,
    },
  })

  const currency = watch('currency')

  const onSubmit = handleSubmit(async (values) => {
    setStatus({ type: 'idle' })
    try {
      let fxRateToSgd = 1
      let fxRateSource: NewChargingSessionRow['fx_rate_source'] = 'api'

      if (values.currency === 'MYR') {
        const dateISO = values.startAt.slice(0, 10)
        const fx = await getHistoricalFxRate(dateISO)
        fxRateToSgd = fx.rate
        fxRateSource = fx.source
      }

      const row: NewChargingSessionRow = {
        start_at: new Date(values.startAt).toISOString(),
        end_at: new Date(values.endAt).toISOString(),
        kwh: values.kwh,
        odometer_km: values.odometerKm,
        batt_before_pct: values.battBefore,
        batt_after_pct: values.battAfter,
        cost: values.cost,
        rebate: values.rebate,
        idle_fees: values.idleFees,
        currency: values.currency,
        fx_rate_to_sgd: fxRateToSgd,
        fx_rate_source: fxRateSource,
        country: values.country,
        charging_type: values.chargingType,
        location: values.location,
        provider: values.provider,
        subscription_plan: values.subscriptionPlan || 'None',
        paid_by: values.paidBy,
      }

      const { error } = await db.from('charging_sessions').insert(row)
      if (error) throw error

      await queryClient.invalidateQueries({ queryKey: CHARGING_SESSIONS_QUERY_KEY })
      setStatus({
        type: 'success',
        message:
          values.currency === 'MYR'
            ? `Saved. FX rate used: 1 MYR = ${fxRateToSgd.toFixed(4)} SGD (${fxRateSource === 'api' ? 'live historical rate' : fxRateSource === 'cached_fallback' ? 'cached fallback rate' : 'fixed fallback rate'}).`
            : 'Saved.',
      })
      reset()
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Failed to save. Please try again.' })
    }
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Charging Start Date & Time" error={errors.startAt?.message}>
          <input type="datetime-local" className={inputClass} {...register('startAt')} />
        </FormField>
        <FormField label="Charging End Date & Time" error={errors.endAt?.message}>
          <input type="datetime-local" className={inputClass} {...register('endAt')} />
        </FormField>

        <FormField label="Total kWh Charged" error={errors.kwh?.message}>
          <input type="number" step="0.01" min="0" className={inputClass} {...register('kwh')} />
        </FormField>
        <FormField label="Odometer (km) Before Charging" error={errors.odometerKm?.message}>
          <input type="number" step="0.1" min="0" className={inputClass} {...register('odometerKm')} />
        </FormField>

        <FormField label="Battery % Before Charging" error={errors.battBefore?.message}>
          <input type="number" step="1" min="0" max="100" className={inputClass} {...register('battBefore')} />
        </FormField>
        <FormField label="Battery % After Charging" error={errors.battAfter?.message}>
          <input type="number" step="1" min="0" max="100" className={inputClass} {...register('battAfter')} />
        </FormField>

        <FormField label="Charging Cost" error={errors.cost?.message}>
          <input type="number" step="0.01" min="0" className={inputClass} {...register('cost')} />
        </FormField>
        <FormField label="Currency" error={errors.currency?.message}>
          <select className={inputClass} {...register('currency')}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Rebate, if any" error={errors.rebate?.message}>
          <input type="number" step="0.01" min="0" className={inputClass} {...register('rebate')} />
        </FormField>
        <FormField label="Idle Fees" error={errors.idleFees?.message}>
          <input type="number" step="0.01" min="0" className={inputClass} {...register('idleFees')} />
        </FormField>

        <FormField label="Country" error={errors.country?.message}>
          <select className={inputClass} {...register('country')}>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Charging Type" error={errors.chargingType?.message}>
          <select className={inputClass} {...register('chargingType')}>
            {CHARGING_TYPES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Charging Location" error={errors.location?.message}>
          <input type="text" list="location-options" className={inputClass} {...register('location')} />
          <datalist id="location-options">
            {(locations.data ?? []).map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </FormField>
        <FormField label="Charging Provider" error={errors.provider?.message}>
          <input type="text" list="provider-options" className={inputClass} {...register('provider')} />
          <datalist id="provider-options">
            {(providers.data ?? []).map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </FormField>

        <FormField label="Subscription Plan" error={errors.subscriptionPlan?.message}>
          <input type="text" placeholder="None" className={inputClass} {...register('subscriptionPlan')} />
        </FormField>
        <FormField label="Paid By" error={errors.paidBy?.message}>
          <input type="text" list="paidby-options" className={inputClass} {...register('paidBy')} />
          <datalist id="paidby-options">
            {(paidBys.data ?? []).map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </FormField>
      </div>

      {currency === 'MYR' && (
        <p className="text-xs text-slate/70">
          The actual historical MYR→SGD exchange rate for the charging start date will be fetched automatically when
          you save.
        </p>
      )}

      {status.type === 'error' && <p className="text-sm text-red">{status.message}</p>}
      {status.type === 'success' && <p className="text-sm text-green">{status.message}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan to-cyan-dim text-void font-semibold text-sm disabled:opacity-50 glow-cyan"
      >
        {isSubmitting ? 'Saving…' : 'Save Charging Session'}
      </button>
    </form>
  )
}
