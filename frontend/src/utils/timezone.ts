import {
  type DayKey,
  type TimeSelection,
  type WeeklyAvailability,
  DAY_KEYS,
  availabilityToGrid,
  gridToAvailability,
} from './availability'

export function detectTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function getTimezoneOffsetMs(date: Date, timezone: string): number {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = fmt.formatToParts(date)
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)!.value, 10)
  const year = get('year')
  const month = get('month') - 1
  const day = get('day')
  let hour = get('hour')
  if (hour === 24) hour = 0
  const minute = get('minute')
  const second = get('second')

  const utcEquiv = Date.UTC(year, month, day, hour, minute, second)
  return utcEquiv - date.getTime()
}

export function convertTimeOfDay(
  hour: number,
  minute: number,
  date: Date,
  fromTz: string,
  toTz: string,
): { hour: number; minute: number; dayOffset: number } {
  const fromOffset = getTimezoneOffsetMs(date, fromTz)
  const utcMs =
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute) - fromOffset

  const toOffset = getTimezoneOffsetMs(new Date(utcMs), toTz)
  const localMs = utcMs + toOffset

  const localDate = new Date(localMs)
  const resultHour = localDate.getUTCHours()
  const resultMinute = localDate.getUTCMinutes()

  const fromDay = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const toDay = Date.UTC(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate())
  const dayOffset = Math.round((toDay - fromDay) / (24 * 60 * 60 * 1000))

  return { hour: resultHour, minute: resultMinute, dayOffset }
}

export interface LocalTimeWindow {
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
  wraps: boolean
  gapStartSlot: number
  gapEndSlot: number
  topSlots: number
  bottomSlots: number
  totalSlots: number
}

function timeToSlots(hour: number, minute: number): number {
  return hour * 2 + (minute >= 30 ? 1 : 0)
}

export function convertRoomWindowToLocal(
  roomStartHour: number,
  roomEndHour: number,
  roomTz: string,
  localTz: string,
  date: Date,
): LocalTimeWindow {
  if (roomTz === localTz) {
    const totalSlots = (roomEndHour - roomStartHour) * 2
    return {
      startHour: roomStartHour,
      startMinute: 0,
      endHour: roomEndHour,
      endMinute: 0,
      wraps: false,
      gapStartSlot: -1,
      gapEndSlot: -1,
      topSlots: 0,
      bottomSlots: totalSlots,
      totalSlots,
    }
  }

  const startConv = convertTimeOfDay(roomStartHour, 0, date, roomTz, localTz)
  const endConv = convertTimeOfDay(roomEndHour, 0, date, roomTz, localTz)

  const localStartSlot = timeToSlots(startConv.hour, startConv.minute)
  const localEndSlot = timeToSlots(endConv.hour, endConv.minute)

  const startDayOffset = startConv.dayOffset
  const endDayOffset = endConv.dayOffset

  if (startDayOffset === endDayOffset) {
    if (localStartSlot < localEndSlot) {
      const totalSlots = localEndSlot - localStartSlot
      return {
        startHour: startConv.hour,
        startMinute: startConv.minute >= 30 ? 30 : 0,
        endHour: endConv.hour,
        endMinute: endConv.minute >= 30 ? 30 : 0,
        wraps: false,
        gapStartSlot: -1,
        gapEndSlot: -1,
        topSlots: 0,
        bottomSlots: totalSlots,
        totalSlots,
      }
    }
  }

  const endSlot48 = localEndSlot + (endDayOffset - startDayOffset) * 48
  if (endSlot48 > localStartSlot && endSlot48 <= 48) {
    const totalSlots = endSlot48 - localStartSlot
    return {
      startHour: startConv.hour,
      startMinute: startConv.minute >= 30 ? 30 : 0,
      endHour: endConv.hour,
      endMinute: endConv.minute >= 30 ? 30 : 0,
      wraps: false,
      gapStartSlot: -1,
      gapEndSlot: -1,
      topSlots: 0,
      bottomSlots: totalSlots,
      totalSlots,
    }
  }

  const topSlots = localEndSlot
  const bottomSlots = 48 - localStartSlot
  const totalSlots = topSlots + bottomSlots

  return {
    startHour: startConv.hour,
    startMinute: startConv.minute >= 30 ? 30 : 0,
    endHour: endConv.hour,
    endMinute: endConv.minute >= 30 ? 30 : 0,
    wraps: true,
    gapStartSlot: topSlots,
    gapEndSlot: topSlots,
    topSlots,
    bottomSlots,
    totalSlots,
  }
}

export function localSlotToTime(
  slotIndex: number,
  window: LocalTimeWindow,
): { hour: number; minute: number; dayOffset: number } {
  if (!window.wraps) {
    const totalMinutes = (window.startHour * 60 + (window.startMinute >= 30 ? 30 : 0)) + slotIndex * 30
    return { hour: Math.floor(totalMinutes / 60), minute: totalMinutes % 60, dayOffset: 0 }
  }

  if (slotIndex < window.topSlots) {
    const totalMinutes = slotIndex * 30
    return { hour: Math.floor(totalMinutes / 60), minute: totalMinutes % 60, dayOffset: 0 }
  }

  const bottomIdx = slotIndex - window.topSlots
  const totalMinutes = (window.startHour * 60 + (window.startMinute >= 30 ? 30 : 0)) + bottomIdx * 30
  return { hour: Math.floor(totalMinutes / 60), minute: totalMinutes % 60, dayOffset: 0 }
}

export function formatLocalSlotTime(slotIndex: number, window: LocalTimeWindow): string {
  const { hour, minute } = localSlotToTime(slotIndex, window)
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

function dayKeyToDayIndex(key: DayKey): number {
  return DAY_KEYS.indexOf(key)
}

function dayIndexToDayKey(index: number): DayKey {
  return DAY_KEYS[((index % 7) + 7) % 7]!
}

export function localSlotToDayKey(
  slotIndex: number,
  dayKey: DayKey,
  window: LocalTimeWindow,
): DayKey {
  if (!window.wraps) return dayKey

  if (slotIndex < window.topSlots) {
    const prevIdx = dayKeyToDayIndex(dayKey) - 1
    return dayIndexToDayKey(prevIdx)
  }

  return dayKey
}

export function convertUserDayToLocalGrid(
  userWeekly: WeeklyAvailability,
  userTz: string,
  viewerTz: string,
  date: Date,
  dayKey: DayKey,
  window: LocalTimeWindow,
): boolean[] {
  if (userTz === viewerTz) {
    const roomStartHour = window.startHour
    const roomEndHour = window.wraps ? window.endHour + 24 : window.endHour
    const raw = availabilityToGrid(userWeekly[dayKey] ?? [], roomStartHour, roomEndHour > 24 ? 24 : roomEndHour)
    if (!window.wraps) return raw

    const prevDayKey = dayIndexToDayKey(dayKeyToDayIndex(dayKey) - 1)
    const prevGrid = availabilityToGrid(userWeekly[prevDayKey] ?? [], 0, 24)
    const topGrid = prevGrid.slice(window.startHour * 2)

    const thisGrid = availabilityToGrid(userWeekly[dayKey] ?? [], 0, 24)
    const bottomGrid = thisGrid.slice(0, window.endHour * 2)

    return [...bottomGrid, ...topGrid]
  }

  const grid = new Array(window.totalSlots).fill(false)
  const refDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))

  for (let s = 0; s < window.totalSlots; s++) {
    const { hour: localHour, minute: localMinute } = localSlotToTime(s, window)
    const isTopSection = window.wraps && s < window.topSlots

    const tempDate = new Date(refDate)

    const conv = convertTimeOfDay(localHour, localMinute, tempDate, viewerTz, userTz)

    let sourceDayKey: DayKey
    if (isTopSection) {
      const prevDayKey = dayIndexToDayKey(dayKeyToDayIndex(dayKey) - 1)
      sourceDayKey = dayIndexToDayKey(dayKeyToDayIndex(prevDayKey) + conv.dayOffset)
    } else {
      sourceDayKey = dayIndexToDayKey(dayKeyToDayIndex(dayKey) + conv.dayOffset)
    }

    const selections = userWeekly[sourceDayKey] ?? []
    for (const sel of selections) {
      const startMin = sel.start.hour * 60 + sel.start.minute
      const endMin = sel.end.hour * 60 + sel.end.minute
      const slotMin = conv.hour * 60 + conv.minute
      if (slotMin >= startMin && slotMin + 30 <= endMin) {
        grid[s] = true
        break
      }
    }
  }

  return grid
}

export function convertLocalGridToUserTz(
  grid: boolean[],
  window: LocalTimeWindow,
  date: Date,
  dayKey: DayKey,
  viewerTz: string,
  userTz: string,
): { dayKey: DayKey; selections: TimeSelection[] }[] {
  if (viewerTz === userTz) {
    if (!window.wraps) {
      return [{ dayKey, selections: gridToAvailability(grid, window.startHour) }]
    }

    const topGrid = grid.slice(0, window.topSlots)
    const bottomGrid = grid.slice(window.topSlots)

    const prevDayKey = dayIndexToDayKey(dayKeyToDayIndex(dayKey) - 1)
    const result: { dayKey: DayKey; selections: TimeSelection[] }[] = []

    const topSel = gridToAvailability(topGrid, 0)
    if (topSel.length > 0) result.push({ dayKey: prevDayKey, selections: topSel })

    const bottomSel = gridToAvailability(bottomGrid, window.startHour)
    if (bottomSel.length > 0) result.push({ dayKey, selections: bottomSel })

    return result
  }

  const buckets: Record<string, boolean[]> = {}
  const refDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))

  for (let s = 0; s < window.totalSlots; s++) {
    const { hour: localHour, minute: localMinute } = localSlotToTime(s, window)
    const isTopSection = window.wraps && s < window.topSlots

    const tempDate = new Date(refDate)
    const conv = convertTimeOfDay(localHour, localMinute, tempDate, viewerTz, userTz)

    let sourceDayKey: DayKey
    if (isTopSection) {
      const prevDayKey = dayIndexToDayKey(dayKeyToDayIndex(dayKey) - 1)
      sourceDayKey = dayIndexToDayKey(dayKeyToDayIndex(prevDayKey) + conv.dayOffset)
    } else {
      sourceDayKey = dayIndexToDayKey(dayKeyToDayIndex(dayKey) + conv.dayOffset)
    }

    if (!buckets[sourceDayKey]) {
      buckets[sourceDayKey] = new Array(48).fill(false)
    }
    const bucket = buckets[sourceDayKey]!
    const slotIdx = conv.hour * 2 + (conv.minute >= 30 ? 1 : 0)
    if (slotIdx >= 0 && slotIdx < 48) {
      bucket[slotIdx] = grid[s]!
    }
  }

  const result: { dayKey: DayKey; selections: TimeSelection[] }[] = []
  for (const [dk, slots] of Object.entries(buckets)) {
    const sel = gridToAvailability(slots, 0)
    if (sel.length > 0) {
      result.push({ dayKey: dk as DayKey, selections: sel })
    }
  }

  return result
}
