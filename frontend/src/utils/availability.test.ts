import { describe, test, expect } from 'vitest'
import {
  availabilityToGrid,
  gridToAvailability,
  formatDateKey,
  getTimeRange,
  applyOverridesToGrid,
  dateToDayKey,
  formatSlotTime,
  type WeeklyAvailability,
  type TimeSelection,
  type Override,
} from './availability'

const emptyWeek: WeeklyAvailability = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
}

describe('availabilityToGrid', () => {
  test('empty selections produce all-false grid', () => {
    const grid = availabilityToGrid([], 10, 12)
    expect(grid).toHaveLength(4)
    expect(grid.every((v) => v === false)).toBe(true)
  })

  test('single selection marks correct slots', () => {
    const sel: TimeSelection[] = [{ start: { hour: 10, minute: 0 }, end: { hour: 11, minute: 0 } }]
    const grid = availabilityToGrid(sel, 10, 12)
    expect(grid).toEqual([true, true, false, false])
  })

  test('half-hour boundaries work', () => {
    const sel: TimeSelection[] = [{ start: { hour: 10, minute: 30 }, end: { hour: 11, minute: 30 } }]
    const grid = availabilityToGrid(sel, 10, 12)
    expect(grid).toEqual([false, true, true, false])
  })
})

describe('gridToAvailability', () => {
  test('empty grid returns empty array', () => {
    const result = gridToAvailability([false, false, false, false], 10)
    expect(result).toEqual([])
  })

  test('contiguous slots produce single selection', () => {
    const result = gridToAvailability([true, true, false, false], 10)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ start: { hour: 10, minute: 0 }, end: { hour: 11, minute: 0 } })
  })

  test('gap produces two selections', () => {
    const result = gridToAvailability([true, false, false, true], 10)
    expect(result).toHaveLength(2)
  })
})

describe('round-trip', () => {
  test('grid -> availability -> grid is identity', () => {
    const original = [true, true, false, true, false, false]
    const avail = gridToAvailability(original, 10)
    const grid = availabilityToGrid(avail, 10, 13)
    expect(grid).toEqual(original)
  })
})

describe('formatDateKey', () => {
  test('formats date as YYYY-MM-DD', () => {
    const d = new Date(2025, 0, 5)
    expect(formatDateKey(d)).toBe('2025-01-05')
  })

  test('pads single-digit month and day', () => {
    const d = new Date(2025, 2, 3)
    expect(formatDateKey(d)).toBe('2025-03-03')
  })
})

describe('getTimeRange', () => {
  test('returns fallback for empty availability', () => {
    const range = getTimeRange(emptyWeek)
    expect(range).toEqual({ startHour: 10, endHour: 23 })
  })

  test('returns correct range from data', () => {
    const week: WeeklyAvailability = {
      ...emptyWeek,
      monday: [{ start: { hour: 14, minute: 0 }, end: { hour: 18, minute: 0 } }],
      friday: [{ start: { hour: 12, minute: 0 }, end: { hour: 20, minute: 30 } }],
    }
    const range = getTimeRange(week)
    expect(range.startHour).toBe(12)
    expect(range.endHour).toBe(21)
  })
})

describe('applyOverridesToGrid', () => {
  const base = [true, true, false, false]

  test('block override removes slots', () => {
    const overrides: Override[] = [
      { date: new Date('2025-01-06'), type: 'block', availability: [{ start: { hour: 10, minute: 0 }, end: { hour: 10, minute: 30 } }] },
    ]
    const result = applyOverridesToGrid(base, overrides, '2025-01-06', 10, 12)
    expect(result).toEqual([false, true, false, false])
  })

  test('unblock override adds slots', () => {
    const overrides: Override[] = [
      { date: new Date('2025-01-06'), type: 'unblock', availability: [{ start: { hour: 11, minute: 0 }, end: { hour: 11, minute: 30 } }] },
    ]
    const result = applyOverridesToGrid(base, overrides, '2025-01-06', 10, 12)
    expect(result).toEqual([true, true, true, false])
  })

  test('override for different date has no effect', () => {
    const overrides: Override[] = [
      { date: new Date('2025-01-07'), type: 'block', availability: [{ start: { hour: 10, minute: 0 }, end: { hour: 12, minute: 0 } }] },
    ]
    const result = applyOverridesToGrid(base, overrides, '2025-01-06', 10, 12)
    expect(result).toEqual(base)
  })
})

describe('dateToDayKey', () => {
  test('Monday returns monday', () => {
    const d = new Date(2025, 0, 6) // Jan 6 2025 is Monday
    expect(dateToDayKey(d)).toBe('monday')
  })

  test('Sunday returns sunday', () => {
    const d = new Date(2025, 0, 5) // Jan 5 2025 is Sunday
    expect(dateToDayKey(d)).toBe('sunday')
  })

  test('Wednesday returns wednesday', () => {
    const d = new Date(2025, 0, 8)
    expect(dateToDayKey(d)).toBe('wednesday')
  })
})

describe('formatSlotTime', () => {
  test('slot 0 at startHour 10 is 10:00', () => {
    expect(formatSlotTime(0, 10)).toBe('10:00')
  })

  test('slot 1 at startHour 10 is 10:30', () => {
    expect(formatSlotTime(1, 10)).toBe('10:30')
  })

  test('slot 4 at startHour 8 is 10:00', () => {
    expect(formatSlotTime(4, 8)).toBe('10:00')
  })
})
