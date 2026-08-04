// Singapore and Malaysia are both fixed UTC+8 (no DST), so converting a
// stored UTC instant back to the local date/time strings used by <input
// type="date">/<input type="time"> is just a fixed +8h shift — no timezone
// library needed. This is the inverse of how ChargingEntryForm/quick-start
// forms build timestamps (`${date}T${time}:00+08:00`).
const SGT_OFFSET_MS = 8 * 60 * 60 * 1000
export const SGT_OFFSET = '+08:00'

export function toSgtParts(d: Date | null): { date: string; time: string } {
  if (!d) return { date: '', time: '' }
  const shifted = new Date(d.getTime() + SGT_OFFSET_MS)
  return { date: shifted.toISOString().slice(0, 10), time: shifted.toISOString().slice(11, 16) }
}

export function fromSgtParts(date: string, time: string): string | null {
  if (!date || !time) return null
  return new Date(`${date}T${time}:00${SGT_OFFSET}`).toISOString()
}
