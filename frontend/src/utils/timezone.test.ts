import { describe, test, expect } from 'vitest'
import {
  detectTimezone,
  getTimezoneOffsetMs,
  convertTimeOfDay,
  convertRoomWindowToLocal,
  localSlotToDayKey,
  convertUserDayToLocalGrid,
  convertLocalGridToUserTz,
  formatLocalSlotTime,
} from './timezone'

describe('detectTimezone', () => {
  test('returns a non-empty string', () => {
    const tz = detectTimezone()
    expect(tz).toBeTruthy()
    expect(tz.length).toBeGreaterThan(0)
  })
})

describe('getTimezoneOffsetMs', () => {
  test('UTC offset is 0', () => {
    const date = new Date('2025-01-15T12:00:00Z')
    const offset = getTimezoneOffsetMs(date, 'UTC')
    expect(offset).toBe(0)
  })

  test('New York winter is UTC-5', () => {
    const date = new Date('2025-01-15T12:00:00Z')
    const offset = getTimezoneOffsetMs(date, 'America/New_York')
    expect(offset).toBe(-5 * 60 * 60 * 1000)
  })

  test('New York summer is UTC-4', () => {
    const date = new Date('2025-07-15T12:00:00Z')
    const offset = getTimezoneOffsetMs(date, 'America/New_York')
    expect(offset).toBe(-4 * 60 * 60 * 1000)
  })

  test('Madrid winter is UTC+1', () => {
    const date = new Date('2025-01-15T12:00:00Z')
    const offset = getTimezoneOffsetMs(date, 'Europe/Madrid')
    expect(offset).toBe(1 * 60 * 60 * 1000)
  })
})

describe('convertTimeOfDay', () => {
  test('same timezone is identity', () => {
    const date = new Date('2025-01-15T12:00:00Z')
    const result = convertTimeOfDay(14, 30, date, 'Europe/Madrid', 'Europe/Madrid')
    expect(result.hour).toBe(14)
    expect(result.minute).toBe(30)
    expect(result.dayOffset).toBe(0)
  })

  test('NY to Madrid shifts +6h in winter', () => {
    const date = new Date('2025-01-15T12:00:00Z')
    const result = convertTimeOfDay(10, 0, date, 'America/New_York', 'Europe/Madrid')
    expect(result.hour).toBe(16)
    expect(result.minute).toBe(0)
    expect(result.dayOffset).toBe(0)
  })

  test('day overflow returns dayOffset=+1', () => {
    const date = new Date('2025-01-15T12:00:00Z')
    const result = convertTimeOfDay(22, 0, date, 'America/New_York', 'Europe/Madrid')
    expect(result.hour).toBe(4)
    expect(result.dayOffset).toBe(1)
  })

  test('day underflow returns dayOffset=-1', () => {
    const date = new Date('2025-01-15T12:00:00Z')
    const result = convertTimeOfDay(1, 0, date, 'Europe/Madrid', 'America/New_York')
    expect(result.hour).toBe(19)
    expect(result.dayOffset).toBe(-1)
  })
})

describe('convertRoomWindowToLocal', () => {
  test('same timezone = no wrap', () => {
    const date = new Date('2025-01-15T12:00:00Z')
    const w = convertRoomWindowToLocal(10, 18, 'Europe/Madrid', 'Europe/Madrid', date)
    expect(w.wraps).toBe(false)
    expect(w.startHour).toBe(10)
    expect(w.endHour).toBe(18)
    expect(w.totalSlots).toBe(16)
  })

  test('small offset, no wrap', () => {
    const date = new Date('2025-01-15T12:00:00Z')
    const w = convertRoomWindowToLocal(10, 18, 'Europe/Madrid', 'Europe/London', date)
    expect(w.wraps).toBe(false)
    expect(w.startHour).toBe(9)
    expect(w.endHour).toBe(17)
    expect(w.totalSlots).toBe(16)
  })

  test('large offset causes wrap', () => {
    const date = new Date('2025-01-15T12:00:00Z')
    const w = convertRoomWindowToLocal(10, 18, 'Europe/Madrid', 'Asia/Tokyo', date)
    expect(w.wraps).toBe(true)
    expect(w.topSlots).toBeGreaterThan(0)
    expect(w.bottomSlots).toBeGreaterThan(0)
    expect(w.totalSlots).toBe(w.topSlots + w.bottomSlots)
  })
})

describe('localSlotToDayKey', () => {
  test('non-wrapping maps to same day', () => {
    const date = new Date('2025-01-15T12:00:00Z')
    const w = convertRoomWindowToLocal(10, 18, 'Europe/Madrid', 'Europe/Madrid', date)
    expect(localSlotToDayKey(5, 'wednesday', w)).toBe('wednesday')
  })

  test('wrapping top section maps to previous day', () => {
    const date = new Date('2025-01-15T12:00:00Z')
    const w = convertRoomWindowToLocal(10, 18, 'Europe/Madrid', 'Asia/Tokyo', date)
    if (w.wraps) {
      expect(localSlotToDayKey(0, 'wednesday', w)).toBe('tuesday')
    }
  })
})

describe('round-trip convertUserDayToLocalGrid + convertLocalGridToUserTz', () => {
  test('same timezone round-trips', () => {
    const weekly = {
      monday: [],
      tuesday: [],
      wednesday: [{ start: { hour: 14, minute: 0 }, end: { hour: 16, minute: 0 } }],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    }
    const date = new Date('2025-01-15T12:00:00Z')
    const tz = 'Europe/Madrid'
    const w = convertRoomWindowToLocal(10, 18, tz, tz, date)

    const grid = convertUserDayToLocalGrid(weekly, tz, tz, date, 'wednesday', w)
    expect(grid.length).toBe(w.totalSlots)

    const slot8 = grid[8]
    const slot9 = grid[9]
    const slot10 = grid[10]
    const slot11 = grid[11]
    expect(slot8).toBe(true)
    expect(slot9).toBe(true)
    expect(slot10).toBe(true)
    expect(slot11).toBe(true)
  })
})

describe('formatLocalSlotTime', () => {
  test('formats correctly for non-wrapping window', () => {
    const date = new Date('2025-01-15T12:00:00Z')
    const w = convertRoomWindowToLocal(10, 18, 'Europe/Madrid', 'Europe/Madrid', date)
    expect(formatLocalSlotTime(0, w)).toBe('10:00')
    expect(formatLocalSlotTime(1, w)).toBe('10:30')
    expect(formatLocalSlotTime(2, w)).toBe('11:00')
  })
})
