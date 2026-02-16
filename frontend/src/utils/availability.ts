export interface TimeOfDay {
  hour: number
  minute: number
}

export interface TimeSelection {
  start: TimeOfDay
  end: TimeOfDay
}

export type WeeklyAvailability = Record<DayKey, TimeSelection[]>

export type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export const DAY_KEYS: DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export interface Override {
  date: Date
  availability: TimeSelection[]
  type: 'unblock' | 'block'
}

export function availabilityToGrid(
  selections: TimeSelection[],
  startHour: number,
  endHour: number,
): boolean[] {
  const slots = (endHour - startHour) * 2
  const grid = new Array(slots).fill(false)
  for (const sel of selections) {
    const from = (sel.start.hour - startHour) * 2 + (sel.start.minute >= 30 ? 1 : 0)
    const to = (sel.end.hour - startHour) * 2 + (sel.end.minute >= 30 ? 1 : 0)
    for (let i = Math.max(0, from); i < Math.min(slots, to); i++) {
      grid[i] = true
    }
  }
  return grid
}

export function gridToAvailability(grid: boolean[], startHour: number): TimeSelection[] {
  const result: TimeSelection[] = []
  let i = 0
  while (i < grid.length) {
    if (grid[i]) {
      const from = i
      while (i < grid.length && grid[i]) i++
      result.push({
        start: slotToTime(from, startHour),
        end: slotToTime(i, startHour),
      })
    } else {
      i++
    }
  }
  return result
}

function slotToTime(index: number, startHour: number): TimeOfDay {
  const totalMinutes = startHour * 60 + index * 30
  return { hour: Math.floor(totalMinutes / 60), minute: totalMinutes % 60 }
}

export function getTimeRange(defaultAvailability: WeeklyAvailability): {
  startHour: number
  endHour: number
} {
  let minHour = 23
  let maxHour = 0
  for (const day of DAY_KEYS) {
    for (const sel of defaultAvailability[day]) {
      if (sel.start.hour < minHour) minHour = sel.start.hour
      const endH = sel.end.minute > 0 ? sel.end.hour + 1 : sel.end.hour
      if (endH > maxHour) maxHour = endH
    }
  }
  if (minHour > maxHour) return { startHour: 10, endHour: 23 }
  return { startHour: minHour, endHour: maxHour }
}

export function formatSlotTime(index: number, startHour: number): string {
  const { hour, minute } = slotToTime(index, startHour)
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

export function dateToDayKey(date: Date): DayKey {
  const jsDay = date.getDay()
  return DAY_KEYS[jsDay === 0 ? 6 : jsDay - 1]!
}

export function applyOverridesToGrid(
  baseGrid: boolean[],
  overrides: Override[],
  dateStr: string,
  startHour: number,
  endHour: number,
): boolean[] {
  const effective = [...baseGrid]
  for (const override of overrides) {
    const oDate = formatDateKey(override.date)
    if (oDate !== dateStr) continue
    const overrideSlots = availabilityToGrid(override.availability, startHour, endHour)
    for (let i = 0; i < effective.length; i++) {
      if (override.type === 'block') {
        if (overrideSlots[i]) effective[i] = false
      } else {
        if (overrideSlots[i]) effective[i] = true
      }
    }
  }
  return effective
}

export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}
