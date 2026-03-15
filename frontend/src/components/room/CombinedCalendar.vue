<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoomStore } from '@/stores/room'
import MiniCalendar from './MiniCalendar.vue'
import {
  DAY_KEYS,
  DAY_I18N_KEYS,
  applyOverridesToGrid,
  getMondayOfWeek,
  formatDateKey,
  dateToDayKey,
} from '@/utils/availability'
import type { DayKey } from '@/utils/availability'
import { convertUserDayToLocalGrid, formatLocalSlotTime } from '@/utils/timezone'

const { t } = useI18n()
const room = useRoomStore()

const selectedWeekStart = ref(getMondayOfWeek(new Date()))
const calendarExpanded = ref(true)

// The 7 dates (Mon-Sun) of the currently viewed week
const weekDates = computed(() => {
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(selectedWeekStart.value)
    d.setDate(d.getDate() + i)
    dates.push(d)
  }
  return dates
})

const weekMonthLabel = computed(() => {
  const start = weekDates.value[0]!
  const end = weekDates.value[6]!
  if (start.getMonth() === end.getMonth()) {
    return start.toLocaleString(undefined, { month: 'long', year: 'numeric' })
  }
  return `${start.toLocaleString(undefined, { month: 'long' })} / ${end.toLocaleString(undefined, { month: 'long', year: 'numeric' })}`
})

// Room time window converted to the viewer's local timezone
const localWindow = computed(() => room.localTimeWindow)
const slotCount = computed(() => localWindow.value.totalSlots)
const startHour = computed(() => room.timeRange.startHour)
const endHour = computed(() => room.timeRange.endHour)
const totalUsers = computed(() => room.users.length)

// Room's default availability in local tz — used to grey out slots outside allowed hours/days
const defaultGrids = computed(() => {
  const roomTz = room.room.timezone
  const viewerTz = room.browserTimezone
  const da = room.room.defaultAvailability
  return Object.fromEntries(
    DAY_KEYS.map((d) => [
      d,
      convertUserDayToLocalGrid(da, roomTz, viewerTz, new Date(), d, localWindow.value),
    ]),
  ) as Record<DayKey, boolean[]>
})

// Whether this slot falls within the room's allowed hours for that day
function isDefaultSlot(dayIdx: number, slotIdx: number) {
  const day = DAY_KEYS[dayIdx]!
  return defaultGrids.value[day][slotIdx]
}

// Per-user, per-day grids (memoised) — reused by combinedGrid and tooltip
const userGrids = computed(() => {
  const viewerTz = room.browserTimezone
  return room.users.map((user) => {
    return weekDates.value.map((date) => {
      const dateStr = formatDateKey(date)
      const dayKey = dateToDayKey(date)
      const base = convertUserDayToLocalGrid(
        user.weeklyAvailability,
        user.timezone,
        viewerTz,
        date,
        dayKey,
        localWindow.value,
      )
      return applyOverridesToGrid(base, user.overrides, dateStr, startHour.value, endHour.value)
    })
  })
})

// For each day×slot, count how many users are available (after applying their overrides)
const combinedGrid = computed(() => {
  const grid: number[][] = []
  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const slots = new Array(slotCount.value).fill(0)
    for (let ui = 0; ui < room.users.length; ui++) {
      const userDay = userGrids.value[ui]![dayIdx]!
      for (let s = 0; s < slotCount.value; s++) {
        if (userDay[s]) slots[s]++
      }
    }
    grid.push(slots)
  }
  return grid
})

// Mark slots where ALL users are free for at least min session duration (consecutive slots)
const viableSlots = computed(() => {
  const minSlots = room.room.duration.min * 2
  const viable: boolean[][] = []
  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const daySlots = combinedGrid.value[dayIdx]!
    const isViable = new Array(slotCount.value).fill(false) as boolean[]

    let streak = 0
    for (let s = 0; s < slotCount.value; s++) {
      if (daySlots[s] === totalUsers.value && totalUsers.value > 0) {
        streak++
      } else {
        if (streak >= minSlots) {
          for (let j = s - streak; j < s; j++) isViable[j] = true
        }
        streak = 0
      }
    }
    if (streak >= minSlots) {
      for (let j = slotCount.value - streak; j < slotCount.value; j++) isViable[j] = true
    }

    viable.push(isViable)
  }
  return viable
})

// CSS class: greyed if outside default, then intensity based on fraction of users available
function slotClass(dayIdx: number, slotIdx: number) {
  if (!isDefaultSlot(dayIdx, slotIdx)) return 'bg-secondary/5 opacity-30'
  const count = combinedGrid.value[dayIdx]![slotIdx]!
  const total = totalUsers.value

  if (total === 0 || count === 0) return 'bg-secondary/10'

  if (count === total) {
    if (viableSlots.value[dayIdx]![slotIdx]) {
      return 'bg-green-400/60 ring-1 ring-green-400/50'
    }
    return 'bg-accent/70'
  }

  const fraction = count / total
  if (fraction > 0.5) return 'bg-accent/40'
  if (fraction > 0.25) return 'bg-accent/25'
  return 'bg-accent/15'
}

// Tooltip state
const tooltipCell = ref<{ dayIdx: number; slotIdx: number } | null>(null)
const tooltipAnchorRect = ref<DOMRect | null>(null)

const tooltipData = computed(() => {
  if (!tooltipCell.value) return null
  const { dayIdx, slotIdx } = tooltipCell.value
  const available = room.users.filter((_, i) => userGrids.value[i]?.[dayIdx]?.[slotIdx])
  const unavailable = room.users.filter((_, i) => !userGrids.value[i]?.[dayIdx]?.[slotIdx])
  const timeLabel = formatLocalSlotTime(slotIdx, localWindow.value)
  const timeEnd = formatLocalSlotTime(slotIdx + 1, localWindow.value)
  return { available, unavailable, timeLabel, timeEnd }
})

const tooltipStyle = computed(() => {
  if (!tooltipAnchorRect.value) return {}
  const r = tooltipAnchorRect.value
  const W = 176
  const pad = 8
  let left = r.left + r.width / 2 - W / 2
  left = Math.max(pad, Math.min(window.innerWidth - W - pad, left))
  if (r.top > 130) {
    return { bottom: `${window.innerHeight - r.top + pad}px`, left: `${left}px` }
  }
  return { top: `${r.bottom + pad}px`, left: `${left}px` }
})

function showTooltip(event: MouseEvent | TouchEvent, dayIdx: number, slotIdx: number) {
  if (!isDefaultSlot(dayIdx, slotIdx)) return
  tooltipAnchorRect.value = (event.currentTarget as HTMLElement).getBoundingClientRect()
  tooltipCell.value = { dayIdx, slotIdx }
}

function hideTooltip() {
  tooltipCell.value = null
}

function onTouchMove(event: TouchEvent) {
  const touch = event.touches[0]
  if (!touch) return
  const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null
  if (!el) return
  const day = el.dataset.day
  const slot = el.dataset.slot
  if (day === undefined || slot === undefined) {
    hideTooltip()
    return
  }
  const dayIdx = parseInt(day)
  const slotIdx = parseInt(slot)
  if (!isDefaultSlot(dayIdx, slotIdx)) {
    hideTooltip()
    return
  }
  tooltipAnchorRect.value = el.getBoundingClientRect()
  tooltipCell.value = { dayIdx, slotIdx }
}

function onDateSelected(date: Date) {
  selectedWeekStart.value = getMondayOfWeek(date)
  calendarExpanded.value = false
}

function toggleCalendar() {
  calendarExpanded.value = !calendarExpanded.value
}

function prevWeek() {
  const d = new Date(selectedWeekStart.value)
  d.setDate(d.getDate() - 7)
  selectedWeekStart.value = d
}

function nextWeek() {
  const d = new Date(selectedWeekStart.value)
  d.setDate(d.getDate() + 7)
  selectedWeekStart.value = d
}

const selectedDateForCalendar = computed(() => weekDates.value[0] ?? null)

const dateAvailability = computed(() => {
  const result: Record<string, 'all' | 'almost' | 'half' | 'few' | 'none'> = {}
  const viewerTz = room.browserTimezone
  const total = room.users.length

  const start = new Date()
  start.setMonth(start.getMonth() - 3)
  start.setDate(1)
  const end = new Date()
  end.setMonth(end.getMonth() + 4)
  end.setDate(0)

  const cursor = new Date(start)
  while (cursor <= end) {
    const dateStr = formatDateKey(cursor)
    const dayKey = dateToDayKey(cursor)

    const slots = new Array(slotCount.value).fill(0) as number[]
    for (const user of room.users) {
      const base = convertUserDayToLocalGrid(
        user.weeklyAvailability,
        user.timezone,
        viewerTz,
        new Date(cursor),
        dayKey,
        localWindow.value,
      )
      const grid = applyOverridesToGrid(base, user.overrides, dateStr, startHour.value, endHour.value)
      for (let s = 0; s < slotCount.value; s++) {
        if (grid[s]) slots[s]++
      }
    }

    let level: 'all' | 'almost' | 'half' | 'few' | 'none' = 'none'
    if (total > 0) {
      const peak = Math.max(...slots)
      if (peak === total) level = 'all'
      else if (peak >= total - 1) level = 'almost'
      else if (peak >= total / 2) level = 'half'
      else if (peak > 0) level = 'few'
    }

    result[dateStr] = level
    cursor.setDate(cursor.getDate() + 1)
  }

  return result
})
</script>

<template>
  <div>
    <!-- Week picker: collapsed — month name -->
    <div v-if="!calendarExpanded" class="mb-2">
      <button
        class="w-full flex items-center justify-between px-1 cursor-pointer"
        @click="toggleCalendar"
      >
        <span class="text-sm font-heading font-bold text-primary capitalize">{{
          weekMonthLabel
        }}</span>
        <VIcon name="fa-chevron-down" scale="0.7" class="text-secondary" />
      </button>
    </div>

    <!-- Week picker: expanded calendar -->
    <div v-if="calendarExpanded" class="mb-2">
      <MiniCalendar
        :model-value="selectedDateForCalendar"
        :override-dates="[]"
        :highlight-week="selectedWeekStart"
        :day-availability="dateAvailability"
        @update:model-value="onDateSelected"
      />
    </div>

    <!-- Legend -->
    <div
      class="sticky bottom-0 z-40 flex flex-wrap justify-center gap-x-2 gap-y-1 px-1 py-2 mb-3 lg:mb-0 bg-bg/90 backdrop-blur-sm text-xs font-heading text-secondary"
    >
      <span class="flex items-center gap-1">
        <span class="inline-block w-3 h-3 rounded-sm bg-green-400/60 ring-1 ring-green-400/50" />
        {{ t('room.viable') }}
      </span>
      <span class="flex items-center gap-1">
        <span class="inline-block w-3 h-3 rounded-sm bg-accent/70" />
        {{ t('room.all_free') }}
      </span>
      <span class="flex items-center gap-1">
        <span class="inline-block w-3 h-3 rounded-sm bg-accent/30" />
        {{ t('room.some_free') }}
      </span>
      <span class="flex items-center gap-1">
        <span class="inline-block w-3 h-3 rounded-sm bg-secondary/10" />
        {{ t('room.none') }}
      </span>
    </div>

    <!-- Combined grid -->
    <div class="select-none mr-1 lg:mr-0 pb-10">
      <div
        class="grid gap-x-0.5 gap-y-px"
        style="grid-template-columns: 2.5rem repeat(7, 1fr) 1.25rem"
      >
        <!-- Day headers -->
        <div />
        <div
          v-for="day in DAY_KEYS"
          :key="day"
          class="text-center text-xs font-heading font-bold pb-1 text-secondary"
        >
          {{ t(DAY_I18N_KEYS[day]) }}
        </div>
        <div class="pointer-events-none" />

        <!-- Date numbers with prev/next arrows in adjacent cells -->
        <button
          class="flex items-center justify-center cursor-pointer text-secondary/60 hover:text-primary transition-colors"
          aria-label="Previous week"
          @click="prevWeek"
        >
          <VIcon name="fa-chevron-left" scale="0.8" />
        </button>
        <div
          v-for="(date, idx) in weekDates"
          :key="'d' + idx"
          class="flex items-center justify-center text-xs font-heading font-bold pb-1 rounded"
          :class="
            formatDateKey(date) === formatDateKey(new Date())
              ? 'bg-primary/20 text-primary'
              : 'text-secondary/60'
          "
        >
          {{ date.getDate() }}
        </div>
        <button
          class="pointer-events-auto flex items-center justify-end cursor-pointer text-secondary/60 hover:text-primary transition-colors"
          aria-label="Next week"
          @click="nextWeek"
        >
          <VIcon name="fa-chevron-right" scale="0.8" />
        </button>

        <!-- Time slot rows -->
        <template v-for="i in slotCount" :key="i - 1">
          <div
            v-if="localWindow.wraps && i - 1 === localWindow.topSlots"
            class="col-span-full text-center text-xs text-secondary/50 font-heading py-1.5 bg-secondary/5 rounded"
          >
            {{ t('room.noSessionHours') }}
          </div>
          <div
            class="text-right pr-1 text-xs text-secondary font-heading flex items-center justify-end leading-none"
          >
            <span v-if="(i - 1) % 2 === 0">{{ formatLocalSlotTime(i - 1, localWindow) }}</span>
          </div>
          <div
            v-for="dayIdx in 7"
            :key="dayIdx - 1"
            class="rounded-sm transition-colors duration-75 min-h-6 touch-none"
            :class="slotClass(dayIdx - 1, i - 1)"
            :data-day="dayIdx - 1"
            :data-slot="i - 1"
            @mouseenter="showTooltip($event, dayIdx - 1, i - 1)"
            @mouseleave="hideTooltip"
            @touchstart.prevent="showTooltip($event, dayIdx - 1, i - 1)"
            @touchmove.prevent="onTouchMove"
            @touchend="hideTooltip"
            @touchcancel="hideTooltip"
          />
          <div class="pointer-events-none" />
        </template>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="tooltip">
      <div
        v-if="tooltipData"
        class="fixed z-50 pointer-events-none w-44 bg-bg border border-secondary/20 rounded-lg shadow-xl px-3 py-2"
        :style="tooltipStyle"
      >
        <p class="text-xs font-heading font-bold text-primary mb-2">
          {{ tooltipData.timeLabel }} – {{ tooltipData.timeEnd }}
        </p>
        <div class="space-y-0.5">
          <div
            v-for="user in tooltipData.available"
            :key="user.id"
            class="flex items-center gap-1.5 text-xs text-secondary"
          >
            <span class="w-2 h-2 rounded-full bg-green-400 shrink-0" />
            {{ user.name }}
          </div>
          <div
            v-for="user in tooltipData.unavailable"
            :key="user.id"
            class="flex items-center gap-1.5 text-xs text-secondary/40"
          >
            <span class="w-2 h-2 rounded-full bg-secondary/25 shrink-0" />
            {{ user.name }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.1s ease;
}
.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}
</style>
