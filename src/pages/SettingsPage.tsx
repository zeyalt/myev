import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { db } from '../lib/dataApiClient'
import Panel from '../components/ui/Panel'
import { inputClass } from '../components/entry/FormField'
import { useSubscriptionPlans, SUBSCRIPTION_PLANS_QUERY_KEY } from '../hooks/useSubscriptionPlans'
import { CHARGING_SESSIONS_QUERY_KEY } from '../hooks/useChargingSessions'
import { CHARGING_SESSIONS_RAW_QUERY_KEY } from '../hooks/useChargingSessionsRaw'
import { kwhFromName, validatePlan, type SubscriptionPlanDef } from '../lib/subscription'

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const { data: plans, isLoading, isError } = useSubscriptionPlans()

  const refreshAll = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_PLANS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ['pastPlans'] }),
      queryClient.invalidateQueries({ queryKey: CHARGING_SESSIONS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: CHARGING_SESSIONS_RAW_QUERY_KEY }),
    ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-slate mt-1">Manage the options used when recording charging sessions.</p>
      </div>

      <Panel title="Subscription Plans">
        <p className="text-xs text-slate/80 mb-4">
          Charging cost is auto-filled as <span className="text-white">kWh charged ÷ plan kWh × plan price</span> (SGD
          sessions only). Plans missing a kWh size or price are still selectable, just not auto-calculated.
        </p>

        {isLoading ? (
          <div className="py-10 text-center text-sm text-slate">Loading plans…</div>
        ) : isError ? (
          <div className="py-6 text-sm text-red">
            Couldn't load plans. If you haven't yet, run <code>neon/05_subscription_plans.sql</code> in the Neon SQL
            Editor and refresh the Data API schema cache. Until then the entry form uses its built-in plan list.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="hidden sm:grid grid-cols-[1fr_7rem_8rem_auto] gap-2 px-1 text-[11px] font-medium text-slate uppercase tracking-wider">
              <span>Plan name</span>
              <span>kWh</span>
              <span>Price (SGD)</span>
              <span className="w-[8.5rem]" />
            </div>
            {(plans ?? []).map((p) => (
              <PlanRow key={p.id} plan={p} allNames={(plans ?? []).map((x) => x.name)} onChanged={refreshAll} />
            ))}
            {(plans ?? []).length === 0 && <div className="py-4 text-sm text-slate">No plans yet — add one below.</div>}
            <div className="border-t border-border-subtle my-2" />
            <PlanRow key={`new-${(plans ?? []).length}`} allNames={(plans ?? []).map((x) => x.name)} onChanged={refreshAll} />
          </div>
        )}
      </Panel>
    </div>
  )
}

/** Existing plan (edit/delete) when `plan` is given, otherwise the "add a plan" row. */
function PlanRow({
  plan,
  allNames,
  onChanged,
}: {
  plan?: SubscriptionPlanDef
  allNames: string[]
  onChanged: () => Promise<unknown>
}) {
  const isNew = !plan
  const [name, setName] = useState(plan?.name ?? '')
  const [kwh, setKwh] = useState(plan?.kwh != null ? String(plan.kwh) : '')
  const [price, setPrice] = useState(plan?.priceSgd != null ? String(plan.priceSgd) : '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const otherNames = allNames.filter((n) => n !== plan?.name)
  const error = isNew && !name.trim() ? null : validatePlan(name, kwh, price, otherNames)
  const changed =
    isNew ||
    name.trim() !== plan.name ||
    (kwh.trim() === '' ? null : Number(kwh)) !== plan.kwh ||
    (price.trim() === '' ? null : Number(price)) !== plan.priceSgd
  const canSave = changed && !busy && !validatePlan(name, kwh, price, otherNames)

  const save = async () => {
    setBusy(true)
    setMessage(null)
    const trimmed = name.trim()
    // New plans: a size hinted by the name (e.g. "…360kWh") is used when kWh is left blank.
    const kwhValue = kwh.trim() !== '' ? Number(kwh) : isNew ? kwhFromName(trimmed) : null
    const row = { name: trimmed, kwh: kwhValue, price_sgd: price.trim() === '' ? null : Number(price) }
    try {
      if (isNew) {
        const { error: e } = await db.from('subscription_plans').insert(row)
        if (e) throw e
        setName('')
        setKwh('')
        setPrice('')
      } else {
        const renamed = trimmed !== plan.name
        if (renamed && !window.confirm(`Rename "${plan.name}" to "${trimmed}"? This also renames it on every past session.`)) {
          setBusy(false)
          return
        }
        const { error: e } = await db.from('subscription_plans').update(row).eq('id', plan.id!)
        if (e) throw e
        if (renamed) {
          const { error: e2 } = await db
            .from('charging_sessions')
            .update({ subscription_plan: trimmed })
            .eq('subscription_plan', plan.name)
          if (e2) throw new Error(`Plan renamed, but updating past sessions failed: ${e2.message}`)
        }
        setMessage('Saved')
      }
      await onChanged()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!window.confirm(`Delete "${plan!.name}"? Past sessions keep this plan name; it just disappears from the dropdown.`)) return
    setBusy(true)
    const { error: e } = await db.from('subscription_plans').delete().eq('id', plan!.id!)
    if (e) {
      setMessage(e.message)
      setBusy(false)
      return
    }
    await onChanged()
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-2 sm:grid-cols-[1fr_7rem_8rem_auto] gap-2 items-center">
        <input
          aria-label="Plan name"
          className={`${inputClass} col-span-2 sm:col-span-1`}
          placeholder={isNew ? 'New plan name, e.g. [Charge+] Regular 360kWh' : undefined}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          aria-label="Plan kWh"
          type="number"
          step="0.01"
          min="0"
          className={inputClass}
          placeholder={isNew ? (kwhFromName(name)?.toString() ?? 'kWh') : 'kWh'}
          value={kwh}
          onChange={(e) => setKwh(e.target.value)}
        />
        <input
          aria-label="Plan price"
          type="number"
          step="0.01"
          min="0"
          className={inputClass}
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <div className="col-span-2 sm:col-span-1 flex items-center gap-2 sm:w-[8.5rem]">
          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-cyan to-cyan-dim text-void font-semibold text-xs disabled:opacity-30"
          >
            {isNew ? 'Add plan' : 'Save'}
          </button>
          {!isNew && (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              title="Delete plan"
              className="px-2 py-2 text-slate hover:text-red transition-colors disabled:opacity-30"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      {(error || message) && <span className={`text-xs px-1 ${error || message !== 'Saved' ? 'text-red' : 'text-green'}`}>{error ?? message}</span>}
    </div>
  )
}
