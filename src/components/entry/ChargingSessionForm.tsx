import { useEffect, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { db } from '../../lib/dataApiClient'
import { getHistoricalFxRate } from '../../lib/fx'
import { fromSgtParts, toSgtParts } from '../../lib/sgtDateTime'
import { CURRENCIES, COUNTRIES, CHARGING_TYPES, SUBSCRIPTION_PLANS, PAID_BY_OPTIONS } from '../../lib/constants'
import { useValuesByFrequency } from '../../hooks/useValuesByFrequency'
import { CHARGING_SESSIONS_QUERY_KEY } from '../../hooks/useChargingSessions'
import { CHARGING_SESSIONS_RAW_QUERY_KEY } from '../../hooks/useChargingSessionsRaw'
import FormField, { inputClass } from './FormField'
import SelectWithOther, { OTHER_SENTINEL } from './SelectWithOther'
import type { NewChargingSessionRow, UpdateChargingSessionRow, RecordRow } from '../../lib/types'

const MAX_TOP_OPTIONS = 12

// Empty-string inputs must become `undefined` (not 0) before zod coercion,
// so an untouched "completion" field is correctly treated as "not yet known"
// rather than "confirmed zero".
const optionalNumber = () =>
  z.preprocess((v) => (v === '' || v === undefined || v === null ? undefined : v), z.coerce.number().min(0).optional())

const schema = z
  .object({
    // Known before charging starts — always required.
    startDate: z.string().min(1, 'Required'),
    startTime: z.string().min(1, 'Required'),
    odometerKm: z.coerce.number().min(0, 'Must be >= 0'),
    battBefore: z.coerce.number().min(0, 'Must be >= 0').max(100, 'Must be <= 100'),
    country: z.enum(COUNTRIES),
    chargingType: z.enum(CHARGING_TYPES),
    location: z.string().min(1, 'Required'),
    locationOther: z.string().optional(),
    provider: z.string().min(1, 'Required'),
    providerOther: z.string().optional(),
    subscriptionPlan: z.string().min(1, 'Required'),
    subscriptionPlanOther: z.string().optional(),

    // Only known once the session ends — optional, filled in later via edit.
    endDate: z.string().optional(),
    endTime: z.string().optional(),
    idleStartDate: z.string().optional(),
    idleStartTime: z.string().optional(),
    idleEndDate: z.string().optional(),
    idleEndTime: z.string().optional(),
    kwh: optionalNumber(),
    battAfter: optionalNumber(),
    cost: optionalNumber(),
    currency: z.union([z.enum(CURRENCIES), z.literal('')]).optional(),
    rebate: optionalNumber(),
    idleFees: optionalNumber(),
    paidBy: z.union([z.enum(PAID_BY_OPTIONS), z.literal('')]).optional(),
  })
  .refine((d) => !(d.endDate && d.endTime) || !d.startDate || !d.startTime || fromSgtParts(d.endDate, d.endTime)! > fromSgtParts(d.startDate, d.startTime)!, {
    message: 'End time must be after start time',
    path: ['endTime'],
  })
  .refine((d) => d.battAfter === undefined || d.battAfter >= d.battBefore, {
    message: 'Battery % After must be >= Battery % Before',
    path: ['battAfter'],
  })
  .refine((d) => d.location !== OTHER_SENTINEL || (d.locationOther?.trim().length ?? 0) > 0, {
    message: 'Enter a custom location',
    path: ['locationOther'],
  })
  .refine((d) => d.provider !== OTHER_SENTINEL || (d.providerOther?.trim().length ?? 0) > 0, {
    message: 'Enter a custom provider',
    path: ['providerOther'],
  })
  .refine((d) => d.subscriptionPlan !== OTHER_SENTINEL || (d.subscriptionPlanOther?.trim().length ?? 0) > 0, {
    message: 'Enter a custom subscription plan',
    path: ['subscriptionPlanOther'],
  })

type FormValues = z.infer<typeof schema>

function round2dp(v: number): number {
  return Math.round(v * 100) / 100
}
function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

function recordToDefaults(r: RecordRow): Partial<FormValues> {
  const start = toSgtParts(r.startAt)
  const end = toSgtParts(r.endAt)
  const idleStart = toSgtParts(r.idleStartAt)
  const idleEnd = toSgtParts(r.idleEndAt)
  return {
    startDate: start.date,
    startTime: start.time,
    odometerKm: r.odometerKm,
    battBefore: r.battBefore,
    country: r.country,
    chargingType: r.chargingType,
    location: r.location,
    provider: r.provider,
    subscriptionPlan: r.subscriptionPlan,
    endDate: end.date,
    endTime: end.time,
    idleStartDate: idleStart.date,
    idleStartTime: idleStart.time,
    idleEndDate: idleEnd.date,
    idleEndTime: idleEnd.time,
    kwh: r.kwh ?? undefined,
    battAfter: r.battAfter ?? undefined,
    cost: r.rawCost ?? undefined,
    currency: r.currency ?? '',
    rebate: r.rawRebate,
    idleFees: r.rawIdleFees,
    paidBy: (r.paidBy as FormValues['paidBy']) ?? '',
  }
}

export default function ChargingSessionForm({
  mode,
  record,
  onDone,
}: {
  mode: 'create' | 'edit'
  record?: RecordRow
  onDone?: () => void
}) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({ type: 'idle' })
  const locations = useValuesByFrequency('charging_sessions', 'location')
  const providers = useValuesByFrequency('charging_sessions', 'provider')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues:
      mode === 'edit' && record
        ? recordToDefaults(record)
        : {
            country: 'Singapore',
            chargingType: 'AC',
            subscriptionPlan: 'None',
          },
  })

  const currency = watch('currency')
  const location = watch('location')
  const provider = watch('provider')
  const subscriptionPlan = watch('subscriptionPlan')

  const locationOptions = (locations.data ?? []).slice(0, MAX_TOP_OPTIONS)
  const providerOptions = (providers.data ?? []).slice(0, MAX_TOP_OPTIONS)
  const subscriptionPlanOptions = SUBSCRIPTION_PLANS.filter((p) => p !== 'Other')

  useEffect(() => {
    if (mode !== 'create') return
    if (locationOptions.length > 0 && !dirtyFields.location) setValue('location', locationOptions[0])
  }, [mode, locationOptions, dirtyFields.location, setValue])
  useEffect(() => {
    if (mode !== 'create') return
    if (providerOptions.length > 0 && !dirtyFields.provider) setValue('provider', providerOptions[0])
  }, [mode, providerOptions, dirtyFields.provider, setValue])

  const onBlurClampPercent = (name: 'battBefore' | 'battAfter') => (e: React.FocusEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    if (!Number.isFinite(v)) return
    const clamped = clamp(v, 0, 100)
    if (clamped !== v) setValue(name, clamped, { shouldValidate: true })
  }
  const onBlurRound2dp = (name: 'cost' | 'rebate' | 'idleFees') => (e: React.FocusEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    if (!Number.isFinite(v)) return
    const rounded = round2dp(v)
    if (rounded !== v) setValue(name, rounded, { shouldValidate: true })
  }

  const invalidateSessions = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: CHARGING_SESSIONS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: CHARGING_SESSIONS_RAW_QUERY_KEY }),
    ])
  }

  const onSubmit = handleSubmit(async (values) => {
    setStatus({ type: 'idle' })
    try {
      const startISO = fromSgtParts(values.startDate, values.startTime)!
      const endISO = fromSgtParts(values.endDate ?? '', values.endTime ?? '')
      const idleStartISO = fromSgtParts(values.idleStartDate ?? '', values.idleStartTime ?? '')
      const idleEndISO = fromSgtParts(values.idleEndDate ?? '', values.idleEndTime ?? '')

      const currencyValue = values.currency || null
      let fxRateToSgd = record?.fxRateToSgd ?? 1
      let fxRateSource = record?.fxRateSource ?? 'api'

      if (currencyValue === 'MYR') {
        const fx = await getHistoricalFxRate(values.startDate)
        fxRateToSgd = fx.rate
        fxRateSource = fx.source
      } else if (currencyValue === 'SGD') {
        fxRateToSgd = 1
        fxRateSource = 'api'
      }

      const resolvedLocation = values.location === OTHER_SENTINEL ? values.locationOther!.trim() : values.location
      const resolvedProvider = values.provider === OTHER_SENTINEL ? values.providerOther!.trim() : values.provider
      const resolvedSubscriptionPlan =
        values.subscriptionPlan === OTHER_SENTINEL ? values.subscriptionPlanOther!.trim() : values.subscriptionPlan

      const row: NewChargingSessionRow = {
        start_at: startISO,
        end_at: endISO,
        idle_start_at: idleStartISO,
        idle_end_at: idleEndISO,
        kwh: values.kwh ?? null,
        odometer_km: values.odometerKm,
        batt_before_pct: values.battBefore,
        batt_after_pct: values.battAfter ?? null,
        cost: values.cost !== undefined ? round2dp(values.cost) : null,
        rebate: round2dp(values.rebate ?? 0),
        idle_fees: round2dp(values.idleFees ?? 0),
        currency: currencyValue,
        fx_rate_to_sgd: fxRateToSgd,
        fx_rate_source: fxRateSource as NewChargingSessionRow['fx_rate_source'],
        country: values.country,
        charging_type: values.chargingType,
        location: resolvedLocation,
        provider: resolvedProvider,
        subscription_plan: resolvedSubscriptionPlan || 'None',
        paid_by: values.paidBy || null,
      }

      if (mode === 'create') {
        const { error } = await db.from('charging_sessions').insert(row)
        if (error) throw error
        await invalidateSessions()
        setStatus({ type: 'success', message: 'Session started — complete it later from Records.' })
        reset({ country: 'Singapore', chargingType: 'AC', subscriptionPlan: 'None' } as Partial<FormValues>)
      } else {
        const updateRow: UpdateChargingSessionRow = row
        const { error } = await db.from('charging_sessions').update(updateRow).eq('id', record!.id)
        if (error) throw error
        await invalidateSessions()
        setStatus({ type: 'success', message: 'Saved.' })
        onDone?.()
      }
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Failed to save. Please try again.' })
    }
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <p className="sm:col-span-2 text-xs font-semibold text-slate uppercase tracking-wider -mb-1">
          Known before charging starts
        </p>

        <div className="grid grid-cols-2 gap-2">
          <FormField label="Charging Start Date" error={errors.startDate?.message}>
            <input type="date" className={inputClass} {...register('startDate')} />
          </FormField>
          <FormField label="Start Time" error={errors.startTime?.message}>
            <input type="time" className={inputClass} {...register('startTime')} />
          </FormField>
        </div>
        <FormField label="Odometer (km) Before Charging" error={errors.odometerKm?.message}>
          <input type="number" step="0.1" min="0" className={inputClass} {...register('odometerKm')} />
        </FormField>

        <FormField label="Battery % Before Charging" error={errors.battBefore?.message}>
          <input
            type="number"
            step="1"
            min="0"
            max="100"
            className={inputClass}
            {...register('battBefore')}
            onBlur={onBlurClampPercent('battBefore')}
          />
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
        <div />

        <SelectWithOther
          label="Charging Location"
          options={locationOptions}
          error={errors.location?.message}
          otherError={errors.locationOther?.message}
          showOther={location === OTHER_SENTINEL}
          selectRegister={register('location')}
          otherRegister={register('locationOther')}
          otherPlaceholder="Enter a new location"
        />
        <SelectWithOther
          label="Charging Provider"
          options={providerOptions}
          error={errors.provider?.message}
          otherError={errors.providerOther?.message}
          showOther={provider === OTHER_SENTINEL}
          selectRegister={register('provider')}
          otherRegister={register('providerOther')}
          otherPlaceholder="Enter a new provider"
        />
        <SelectWithOther
          label="Subscription Plan"
          options={subscriptionPlanOptions as unknown as string[]}
          error={errors.subscriptionPlan?.message}
          otherError={errors.subscriptionPlanOther?.message}
          showOther={subscriptionPlan === OTHER_SENTINEL}
          selectRegister={register('subscriptionPlan')}
          otherRegister={register('subscriptionPlanOther')}
          otherPlaceholder="Enter a new plan"
        />

        <p className="sm:col-span-2 text-xs font-semibold text-slate uppercase tracking-wider mt-2 -mb-1">
          Known once charging ends {mode === 'create' && '(fill in later via Records)'}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <FormField label="Charging End Date" error={errors.endDate?.message}>
            <input type="date" className={inputClass} {...register('endDate')} />
          </FormField>
          <FormField label="End Time" error={errors.endTime?.message}>
            <input type="time" className={inputClass} {...register('endTime')} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FormField label="Idle Start Date" error={errors.idleStartDate?.message}>
            <input type="date" className={inputClass} {...register('idleStartDate')} />
          </FormField>
          <FormField label="Idle Start Time" error={errors.idleStartTime?.message}>
            <input type="time" className={inputClass} {...register('idleStartTime')} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FormField label="Idle End Date" error={errors.idleEndDate?.message}>
            <input type="date" className={inputClass} {...register('idleEndDate')} />
          </FormField>
          <FormField label="Idle End Time" error={errors.idleEndTime?.message}>
            <input type="time" className={inputClass} {...register('idleEndTime')} />
          </FormField>
        </div>
        <FormField label="Total kWh Charged" error={errors.kwh?.message}>
          <input type="number" step="0.01" min="0" className={inputClass} {...register('kwh')} />
        </FormField>

        <FormField label="Battery % After Charging" error={errors.battAfter?.message}>
          <input
            type="number"
            step="1"
            min="0"
            max="100"
            className={inputClass}
            {...register('battAfter')}
            onBlur={onBlurClampPercent('battAfter')}
          />
        </FormField>
        <FormField label="Currency" error={errors.currency?.message}>
          <select className={inputClass} {...register('currency')}>
            <option value="">—</option>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Charging Cost" error={errors.cost?.message}>
          <input type="number" step="0.01" min="0" className={inputClass} {...register('cost')} onBlur={onBlurRound2dp('cost')} />
        </FormField>
        <FormField label="Rebate, if any" error={errors.rebate?.message}>
          <input type="number" step="0.01" min="0" className={inputClass} {...register('rebate')} onBlur={onBlurRound2dp('rebate')} />
        </FormField>

        <FormField label="Idle Fees" error={errors.idleFees?.message}>
          <input
            type="number"
            step="0.01"
            min="0"
            className={inputClass}
            {...register('idleFees')}
            onBlur={onBlurRound2dp('idleFees')}
          />
        </FormField>
        <FormField label="Paid By" error={errors.paidBy?.message}>
          <select className={inputClass} {...register('paidBy')}>
            <option value="">—</option>
            {PAID_BY_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
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
        {isSubmitting ? 'Saving…' : mode === 'create' ? 'Start Session' : 'Save Changes'}
      </button>
    </form>
  )
}
