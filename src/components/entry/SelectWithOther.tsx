import type { UseFormRegisterReturn } from 'react-hook-form'
import FormField, { inputClass } from './FormField'

export const OTHER_SENTINEL = '__other__'

/**
 * A <select> populated with `options` plus a trailing "Other" entry; picking
 * "Other" reveals a free-text input for a custom value. Used for fields with
 * a curated top-N list (frequency-ranked history, or a fixed enum) that still
 * need an escape hatch for anything not in the list.
 */
export default function SelectWithOther({
  label,
  options,
  error,
  otherError,
  showOther,
  selectRegister,
  otherRegister,
  otherPlaceholder = 'Enter a custom value',
}: {
  label: string
  options: string[]
  error?: string
  otherError?: string
  showOther: boolean
  selectRegister: UseFormRegisterReturn
  otherRegister: UseFormRegisterReturn
  otherPlaceholder?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <FormField label={label} error={error}>
        <select className={inputClass} {...selectRegister}>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
          <option value={OTHER_SENTINEL}>Other…</option>
        </select>
      </FormField>
      {showOther && (
        <FormField label={`${label} (custom)`} error={otherError}>
          <input type="text" placeholder={otherPlaceholder} className={inputClass} {...otherRegister} />
        </FormField>
      )}
    </div>
  )
}
