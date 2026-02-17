<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoomStore } from '@/stores/room'
import { useToast } from '@/composables/useToast'
import MiniCalendar from './MiniCalendar.vue'
import CombinedCalendar from './CombinedCalendar.vue'
import {
  type DayKey,
  type WeeklyAvailability,
  DAY_KEYS,
  DAY_I18N_KEYS,
  availabilityToGrid,
  gridToAvailability,
  dateToDayKey,
  formatDateKey,
  getMondayOfWeek,
} from '@/utils/availability'
import {
  convertUserDayToLocalGrid,
  convertLocalGridToUserTz,
  formatLocalSlotTime,
} from '@/utils/timezone'

const props = defineProps<{
  initialTab?: 'weekly' | 'overrides' | 'combined'
}>()

const emit = defineEmits<{ 'update:tab': [tab: Tab] }>()

const { t } = useI18n()
const room = useRoomStore()
const toast = useToast()

type Tab = 'weekly' | 'overrides' | 'combined'
const activeTab = ref<Tab>(props.initialTab ?? 'weekly')
const showInfo = ref(false)

watch(
  () => props.initialTab,
  (val) => {
    if (val) activeTab.value = val
  },
)

watch(activeTab, (val) => {
  emit('update:tab', val)
})

// === Weekly mode ===
const localWindow = computed(() => room.localTimeWindow)
const slotCount = computed(() => localWindow.value.totalSlots)
const startHour = computed(() => room.timeRange.startHour)
const endHour = computed(() => room.timeRange.endHour)

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

const weeklyGrids = computed(() => {
  const user = room.currentUser
  const empty = new Array(slotCount.value).fill(false) as boolean[]
  if (!user)
    return Object.fromEntries(DAY_KEYS.map((d) => [d, [...empty]])) as Record<DayKey, boolean[]>
  const userTz = user.timezone
  const viewerTz = room.browserTimezone
  return Object.fromEntries(
    DAY_KEYS.map((d) => [
      d,
      convertUserDayToLocalGrid(
        user.weeklyAvailability,
        userTz,
        viewerTz,
        new Date(),
        d,
        localWindow.value,
      ),
    ]),
  ) as Record<DayKey, boolean[]>
})

// === Override mode ===
const selectedDate = ref<Date | null>(null)
const calendarExpanded = ref(true)
const overrideHighlightWeek = computed(() =>
  selectedDate.value ? getMondayOfWeek(selectedDate.value) : null,
)

const overrideDates = computed(() => {
  const user = room.currentUser
  if (!user) return []
  return user.overrides.map((o) => formatDateKey(o.date))
})

const overrideWeekDates = computed(() => {
  if (!overrideHighlightWeek.value) return []
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(overrideHighlightWeek.value)
    d.setDate(d.getDate() + i)
    dates.push(d)
  }
  return dates
})

type OverrideCell = { base: boolean; effective: boolean; overridden: boolean }

const overrideWeekGrids = computed(() => {
  if (!selectedDate.value || !room.currentUser) return null
  const grids: Record<number, OverrideCell[]> = {}
  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const date = overrideWeekDates.value[dayIdx]!
    const dayKey = dateToDayKey(date)
    const baseGrid = availabilityToGrid(
      room.currentUser.weeklyAvailability[dayKey] ?? [],
      startHour.value,
      endHour.value,
    )
    const dateStr = formatDateKey(date)
    const override = room.currentUser.overrides.find((o) => formatDateKey(o.date) === dateStr)
    if (!override) {
      grids[dayIdx] = baseGrid.map((on) => ({ base: on, effective: on, overridden: false }))
    } else {
      const overrideSlots = availabilityToGrid(
        override.availability,
        startHour.value,
        endHour.value,
      )
      grids[dayIdx] = baseGrid.map((base, i) => {
        if (override.type === 'block') {
          return {
            base,
            effective: base && !overrideSlots[i],
            overridden: base && !!overrideSlots[i],
          }
        }
        return {
          base,
          effective: base || !!overrideSlots[i],
          overridden: !base && !!overrideSlots[i],
        }
      })
    }
  }
  return grids
})

function onDateSelected(date: Date) {
  selectedDate.value = date
  calendarExpanded.value = false
}

function toggleCalendar() {
  calendarExpanded.value = !calendarExpanded.value
}

// === Paint logic ===
type PaintMode = 'paint' | 'erase' | null
const painting = ref<PaintMode>(null)
const dragStartSlot = ref(-1)
const dragCurrentSlot = ref(-1)
const dragStartDay = ref(-1)
const dragCurrentDay = ref(-1)
watch(
  () => room.saveError,
  (val) => {
    if (!val) return
    toast.show(t('room.saveError'), 'error')
    room.saveError = false
  },
)

function onPointerDown(e: PointerEvent) {
  const el = (e.target as HTMLElement).closest('[data-slot]') as HTMLElement | null
  if (!el) return

  const slotIdx = parseInt(el.dataset.slot!, 10)
  const dayIdx = parseInt(el.dataset.day!, 10)
  if (isNaN(dayIdx)) return
  if (!isDefaultSlot(dayIdx, slotIdx)) return

  ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  dragStartSlot.value = slotIdx
  dragCurrentSlot.value = slotIdx
  dragStartDay.value = dayIdx
  dragCurrentDay.value = dayIdx

  if (activeTab.value === 'weekly') {
    const day = DAY_KEYS[dayIdx]!
    painting.value = weeklyGrids.value[day][slotIdx] ? 'erase' : 'paint'
  } else {
    if (!overrideWeekGrids.value) return
    const cell = overrideWeekGrids.value[dayIdx]![slotIdx]!
    painting.value = cell.effective ? 'erase' : 'paint'
  }
}

function onPointerMove(e: PointerEvent) {
  if (painting.value === null) return
  const el = document.elementFromPoint(e.clientX, e.clientY)
  if (!el) return
  const slot = (el as HTMLElement).closest('[data-slot]') as HTMLElement | null
  if (!slot) return
  dragCurrentSlot.value = parseInt(slot.dataset.slot!, 10)
  if (slot.dataset.day != null) {
    dragCurrentDay.value = parseInt(slot.dataset.day, 10)
  }
}

function onPointerUp() {
  if (painting.value === null) return

  if (activeTab.value === 'weekly') {
    commitWeeklyPaint()
  } else {
    commitOverridePaint()
  }

  toast.show(t('room.saved'), 'success')
  painting.value = null
  dragStartSlot.value = -1
  dragCurrentSlot.value = -1
  dragStartDay.value = -1
  dragCurrentDay.value = -1
}

function commitWeeklyPaint() {
  const user = room.currentUser
  if (!user) return
  const minDay = Math.min(dragStartDay.value, dragCurrentDay.value)
  const maxDay = Math.max(dragStartDay.value, dragCurrentDay.value)
  const minSlot = Math.min(dragStartSlot.value, dragCurrentSlot.value)
  const maxSlot = Math.max(dragStartSlot.value, dragCurrentSlot.value)

  const userTz = user.timezone
  const viewerTz = room.browserTimezone
  const updated: WeeklyAvailability = { ...user.weeklyAvailability }

  for (let d = minDay; d <= maxDay; d++) {
    const day = DAY_KEYS[d]!
    const grid = [...weeklyGrids.value[day]]
    for (let s = minSlot; s <= maxSlot; s++) {
      grid[s] = painting.value === 'paint'
    }

    const converted = convertLocalGridToUserTz(
      grid,
      localWindow.value,
      new Date(),
      day,
      viewerTz,
      userTz,
    )
    for (const { dayKey, selections } of converted) {
      updated[dayKey] = selections
    }
  }
  room.saveWeeklyAvailability(updated)
}

function commitOverridePaint() {
  const user = room.currentUser
  if (!user || !overrideWeekGrids.value) return

  const minDay = Math.min(dragStartDay.value, dragCurrentDay.value)
  const maxDay = Math.max(dragStartDay.value, dragCurrentDay.value)
  const minSlot = Math.min(dragStartSlot.value, dragCurrentSlot.value)
  const maxSlot = Math.max(dragStartSlot.value, dragCurrentSlot.value)

  const paintedDateStrs = new Set(
    Array.from({ length: maxDay - minDay + 1 }, (_, i) =>
      formatDateKey(overrideWeekDates.value[minDay + i]!),
    ),
  )
  const newOverrides = user.overrides.filter((o) => !paintedDateStrs.has(formatDateKey(o.date)))

  for (let d = minDay; d <= maxDay; d++) {
    const date = overrideWeekDates.value[d]!
    const dayKey = dateToDayKey(date)
    const baseGrid = availabilityToGrid(
      user.weeklyAvailability[dayKey] ?? [],
      startHour.value,
      endHour.value,
    )
    const effectiveGrid = overrideWeekGrids.value[d]!.map((c) => c.effective)
    for (let s = minSlot; s <= maxSlot; s++) {
      effectiveGrid[s] = painting.value === 'paint'
    }

    const blocked: boolean[] = []
    const unblocked: boolean[] = []
    for (let i = 0; i < effectiveGrid.length; i++) {
      blocked.push(!!baseGrid[i] && !effectiveGrid[i])
      unblocked.push(!baseGrid[i] && !!effectiveGrid[i])
    }

    if (blocked.some(Boolean)) {
      newOverrides.push({
        date: date,
        type: 'block',
        availability: gridToAvailability(blocked, startHour.value),
      })
    }
    if (unblocked.some(Boolean)) {
      newOverrides.push({
        date: date,
        type: 'unblock',
        availability: gridToAvailability(unblocked, startHour.value),
      })
    }
  }

  room.saveOverrides(newOverrides)
}

function isInWeeklyDragRange(dayIdx: number, slotIdx: number) {
  if (painting.value === null || dragStartDay.value < 0) return false
  const minDay = Math.min(dragStartDay.value, dragCurrentDay.value)
  const maxDay = Math.max(dragStartDay.value, dragCurrentDay.value)
  const minSlot = Math.min(dragStartSlot.value, dragCurrentSlot.value)
  const maxSlot = Math.max(dragStartSlot.value, dragCurrentSlot.value)
  return dayIdx >= minDay && dayIdx <= maxDay && slotIdx >= minSlot && slotIdx <= maxSlot
}

function isDefaultSlot(dayIdx: number, slotIdx: number) {
  const day = DAY_KEYS[dayIdx]!
  return defaultGrids.value[day][slotIdx]
}

function weeklySlotClass(dayIdx: number, slotIdx: number) {
  if (!isDefaultSlot(dayIdx, slotIdx)) return 'bg-secondary/5 opacity-30'
  const day = DAY_KEYS[dayIdx]!
  const on = weeklyGrids.value[day][slotIdx]
  if (isInWeeklyDragRange(dayIdx, slotIdx)) {
    return painting.value === 'paint' ? 'bg-accent/50' : 'bg-secondary/20'
  }
  return on ? 'bg-accent' : 'bg-secondary/10'
}

function overrideSlotClass(dayIdx: number, slotIdx: number) {
  if (!isDefaultSlot(dayIdx, slotIdx)) return 'bg-secondary/5 opacity-30'
  if (!overrideWeekGrids.value) return 'bg-secondary/10'
  const cell = overrideWeekGrids.value[dayIdx]?.[slotIdx]
  if (!cell) return 'bg-secondary/10'
  const inRange = isInWeeklyDragRange(dayIdx, slotIdx)

  if (inRange) {
    return painting.value === 'paint' ? 'bg-green-400/40' : 'bg-red-400/40'
  }
  if (cell.overridden && !cell.effective) return 'bg-red-400/60'
  if (cell.overridden && cell.effective) return 'bg-green-400/60'
  if (cell.effective) return 'bg-accent'
  return 'bg-secondary/10'
}

watch(activeTab, () => {
  showInfo.value = false
})
</script>

<template>
  <div class="h-full overflow-y-auto p-2 pb-15 lg:pb-0">
    <!-- Tabs -->
    <div class="flex gap-2 mb-1 sticky top-0 z-10 bg-bg pt-0.5 pb-1">
      <button
        v-for="tab in ['weekly', 'overrides', 'combined'] as Tab[]"
        :key="tab"
        class="flex-1 py-2 rounded-lg font-heading font-bold text-sm transition-colors cursor-pointer"
        :class="
          activeTab === tab
            ? 'bg-accent text-bg'
            : 'bg-secondary/20 text-secondary hover:bg-secondary/30'
        "
        @click="activeTab = tab"
      >
        {{
          t(
            tab === 'weekly'
              ? 'room.tabWeekly'
              : tab === 'overrides'
                ? 'room.tabOverrides'
                : 'room.tabCombined',
          )
        }}
      </button>
    </div>

    <!-- Subtitle + info -->
    <div class="flex items-center gap-1.5 mb-1 px-1 justify-between">
      <p class="text-md text-primary font-bold font-heading">
        {{
          t(
            activeTab === 'weekly'
              ? 'room.weeklySubtitle'
              : activeTab === 'overrides'
                ? 'room.overridesSubtitle'
                : 'room.combinedSubtitle',
          )
        }}
      </p>
      <button
        class="shrink-0 text-xl font-heading rounded-full h-7 w-7 pb-1 flex items-center justify-center text-secondary hover:text-secondary hover:bg-secondary/15 transition-colors cursor-pointer font-bold border border-secondary"
        @click="showInfo = !showInfo"
      >
        ?
      </button>
    </div>

    <!-- Info tooltip -->
    <Transition name="info">
      <div
        v-if="showInfo"
        class="mx-1 mb-2 px-3 py-3 rounded-lg bg-secondary/10 text-md text-secondary/80 font-heading leading-relaxed"
      >
        {{
          t(
            activeTab === 'weekly'
              ? 'room.weeklyInfo'
              : activeTab === 'overrides'
                ? 'room.overridesInfo'
                : 'room.combinedInfo',
          )
        }}
      </div>
    </Transition>

    <!-- Weekly mode: 7-day table -->
    <template v-if="activeTab === 'weekly'">
      <div class="select-none mr-5 lg:mr-0">
        <div class="grid gap-x-0.5 gap-y-px" style="grid-template-columns: 2.5rem repeat(7, 1fr)">
          <!-- Day headers -->
          <div />
          <div
            v-for="day in DAY_KEYS"
            :key="day"
            class="text-center text-xs font-heading font-bold pb-1 text-secondary"
          >
            {{ t(DAY_I18N_KEYS[day]) }}
          </div>

          <!-- Time slot rows -->
          <template v-for="i in slotCount" :key="i - 1">
            <!-- Gap separator for cross-midnight wrapping -->
            <div
              v-if="localWindow.wraps && i - 1 === localWindow.topSlots"
              class="col-span-full text-center text-xs text-secondary font-heading py-1.5 bg-secondary rounded"
            >
              {{ t('room.noSessionHours') }}
            </div>
            <div
              class="text-right pr-1 text-xs text-secondary font-heading flex items-center justify-end leading-none"
            >
              <span v-if="(i - 1) % 2 === 0">{{ formatLocalSlotTime(i - 1, localWindow) }}</span>
            </div>
            <div
              v-for="(day, dayIdx) in DAY_KEYS"
              :key="day"
              :data-day="dayIdx"
              :data-slot="i - 1"
              name="slot"
              class="rounded-sm transition-colors duration-75 min-h-6"
              style="touch-action: none"
              :class="weeklySlotClass(dayIdx, i - 1)"
              @pointerdown="onPointerDown"
              @pointermove="onPointerMove"
              @pointerup="onPointerUp"
              @pointercancel="onPointerUp"
            />
          </template>
        </div>
      </div>
    </template>

    <!-- Override mode -->
    <template v-else-if="activeTab === 'overrides'">
      <!-- Collapsible calendar -->
      <div v-if="selectedDate && !calendarExpanded" class="mb-2">
        <button
          class="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/10 hover:bg-secondary/15 transition-colors cursor-pointer"
          @click="toggleCalendar"
        >
          <span class="text-sm font-heading font-bold text-primary">
            {{
              selectedDate.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })
            }}
          </span>
          <VIcon name="gi-arrow-dunk" scale="0.7" class="text-secondary" />
        </button>
      </div>

      <div v-if="calendarExpanded" class="mb-2">
        <MiniCalendar
          :model-value="selectedDate"
          :override-dates="overrideDates"
          :highlight-week="overrideHighlightWeek"
          @update:model-value="onDateSelected"
        />
      </div>

      <!-- Override grid (7-day week) -->
      <template v-if="selectedDate && overrideWeekGrids">
        <div class="select-none mr-5 lg:mr-0">
          <div class="grid gap-x-0.5 gap-y-px" style="grid-template-columns: 2.5rem repeat(7, 1fr)">
            <!-- Day headers -->
            <div />
            <div
              v-for="day in DAY_KEYS"
              :key="day"
              class="text-center text-xs font-heading font-bold pb-1 text-secondary"
            >
              {{ t(DAY_I18N_KEYS[day]) }}
            </div>

            <!-- Date numbers -->
            <div />
            <div
              v-for="(date, idx) in overrideWeekDates"
              :key="'od' + idx"
              class="text-center text-xs font-heading font-bold pb-1 rounded"
              :class="[
                formatDateKey(date) === formatDateKey(new Date())
                  ? 'bg-primary/20 text-primary'
                  : 'text-secondary/60',
                selectedDate && formatDateKey(date) === formatDateKey(selectedDate)
                  ? 'ring-1 ring-accent/50'
                  : '',
              ]"
            >
              {{ date.getDate() }}
            </div>

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
                v-for="(day, dayIdx) in DAY_KEYS"
                :key="day"
                :data-day="dayIdx"
                :data-slot="i - 1"
                class="rounded-sm transition-colors duration-75 min-h-6"
                style="touch-action: none"
                :class="overrideSlotClass(dayIdx, i - 1)"
                @pointerdown="onPointerDown"
                @pointermove="onPointerMove"
                @pointerup="onPointerUp"
                @pointercancel="onPointerUp"
              />
            </template>
          </div>
        </div>
      </template>

      <div v-else-if="!selectedDate" class="flex-1 flex items-center justify-center">
        <p class="text-secondary/60 font-heading text-sm">{{ t('room.noDateSelected') }}</p>
      </div>
    </template>

    <!-- Combined mode -->
    <template v-else-if="activeTab === 'combined'">
      <CombinedCalendar />
    </template>
  </div>
</template>

<style scoped>
.info-enter-active,
.info-leave-active {
  transition: all 0.2s ease;
}
.info-enter-from,
.info-leave-to {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
  overflow: hidden;
}
.info-enter-to,
.info-leave-from {
  max-height: 100px;
  overflow: hidden;
}
</style>
