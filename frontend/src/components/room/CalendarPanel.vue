<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoomStore } from '@/stores/room'
import MiniCalendar from './MiniCalendar.vue'
import {
  type DayKey,
  type WeeklyAvailability,
  DAY_KEYS,
  availabilityToGrid,
  gridToAvailability,
  formatSlotTime,
  dateToDayKey,
  formatDateKey,
} from '@/utils/availability'

const { t } = useI18n()
const room = useRoomStore()

type Tab = 'weekly' | 'overrides'
const activeTab = ref<Tab>('weekly')
const showInfo = ref(false)

// === Weekly mode ===
const dayI18nKeys: Record<DayKey, string> = {
  monday: 'roomLogin.day_monday',
  tuesday: 'roomLogin.day_tuesday',
  wednesday: 'roomLogin.day_wednesday',
  thursday: 'roomLogin.day_thursday',
  friday: 'roomLogin.day_friday',
  saturday: 'roomLogin.day_saturday',
  sunday: 'roomLogin.day_sunday',
}

const startHour = computed(() => room.timeRange.startHour)
const endHour = computed(() => room.timeRange.endHour)
const slotCount = computed(() => (endHour.value - startHour.value) * 2)

const weeklyGrids = computed(() => {
  const user = room.currentUser
  const empty = new Array(slotCount.value).fill(false) as boolean[]
  if (!user)
    return Object.fromEntries(DAY_KEYS.map((d) => [d, [...empty]])) as Record<DayKey, boolean[]>
  return Object.fromEntries(
    DAY_KEYS.map((d) => [
      d,
      availabilityToGrid(user.weeklyAvailability[d] ?? [], startHour.value, endHour.value),
    ]),
  ) as Record<DayKey, boolean[]>
})

// === Override mode ===
const selectedDate = ref<Date | null>(null)
const calendarExpanded = ref(true)

const overrideDates = computed(() => {
  const user = room.currentUser
  if (!user) return []
  return user.overrides.map((o) =>
    typeof o.date === 'string' ? o.date : formatDateKey(new Date(o.date)),
  )
})

const overrideGrid = computed(() => {
  if (!selectedDate.value || !room.currentUser) return null
  const dayKey = dateToDayKey(selectedDate.value)
  const baseGrid = availabilityToGrid(
    room.currentUser.weeklyAvailability[dayKey] ?? [],
    startHour.value,
    endHour.value,
  )
  const dateStr = formatDateKey(selectedDate.value)
  const override = room.currentUser.overrides.find(
    (o) => (typeof o.date === 'string' ? o.date : formatDateKey(new Date(o.date))) === dateStr,
  )
  if (!override) return baseGrid.map((on) => ({ base: on, effective: on, overridden: false }))

  const overrideSlots = availabilityToGrid(override.availability, startHour.value, endHour.value)
  return baseGrid.map((base, i) => {
    if (override.type === 'block') {
      return { base, effective: base && !overrideSlots[i], overridden: base && overrideSlots[i] }
    }
    return { base, effective: base || overrideSlots[i], overridden: !base && overrideSlots[i] }
  })
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
const savedVisible = ref(false)
let savedTimer: ReturnType<typeof setTimeout> | null = null

function flashSaved() {
  savedVisible.value = true
  if (savedTimer) clearTimeout(savedTimer)
  savedTimer = setTimeout(() => (savedVisible.value = false), 1500)
}

function onPointerDown(e: PointerEvent) {
  const el = (e.target as HTMLElement).closest('[data-slot]') as HTMLElement | null
  if (!el) return
  ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)

  const slotIdx = parseInt(el.dataset.slot!, 10)
  dragStartSlot.value = slotIdx
  dragCurrentSlot.value = slotIdx

  if (activeTab.value === 'weekly') {
    const dayIdx = parseInt(el.dataset.day!, 10)
    if (isNaN(dayIdx)) return
    dragStartDay.value = dayIdx
    dragCurrentDay.value = dayIdx
    const day = DAY_KEYS[dayIdx]!
    painting.value = weeklyGrids.value[day][slotIdx] ? 'erase' : 'paint'
  } else {
    if (!overrideGrid.value) return
    const cell = overrideGrid.value[slotIdx]!
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
  if (activeTab.value === 'weekly' && slot.dataset.day != null) {
    dragCurrentDay.value = parseInt(slot.dataset.day, 10)
  }
}

function onPointerUp() {
  if (painting.value === null) return

  if (activeTab.value === 'weekly') {
    commitWeeklyPaint()
  } else {
    const minI = Math.min(dragStartSlot.value, dragCurrentSlot.value)
    const maxI = Math.max(dragStartSlot.value, dragCurrentSlot.value)
    commitOverridePaint(minI, maxI)
  }

  flashSaved()
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

  const updated: WeeklyAvailability = { ...user.weeklyAvailability }
  for (let d = minDay; d <= maxDay; d++) {
    const day = DAY_KEYS[d]!
    const grid = [...weeklyGrids.value[day]]
    for (let s = minSlot; s <= maxSlot; s++) {
      grid[s] = painting.value === 'paint'
    }
    updated[day] = gridToAvailability(grid, startHour.value)
  }
  room.saveWeeklyAvailability(updated)
}

function commitOverridePaint(minI: number, maxI: number) {
  const user = room.currentUser
  if (!user || !selectedDate.value || !overrideGrid.value) return

  const dayKey = dateToDayKey(selectedDate.value)
  const baseGrid = availabilityToGrid(
    user.weeklyAvailability[dayKey] ?? [],
    startHour.value,
    endHour.value,
  )
  const effectiveGrid = overrideGrid.value.map((c) => c.effective)
  for (let i = minI; i <= maxI; i++) {
    effectiveGrid[i] = painting.value === 'paint'
  }

  const blocked: boolean[] = []
  const unblocked: boolean[] = []
  for (let i = 0; i < effectiveGrid.length; i++) {
    blocked.push(!!baseGrid[i] && !effectiveGrid[i])
    unblocked.push(!baseGrid[i] && !!effectiveGrid[i])
  }

  const dateStr = formatDateKey(selectedDate.value)
  const newOverrides = user.overrides.filter(
    (o) => (typeof o.date === 'string' ? o.date : formatDateKey(new Date(o.date))) !== dateStr,
  )

  const hasBlocks = blocked.some(Boolean)
  const hasUnblocks = unblocked.some(Boolean)

  if (hasBlocks) {
    newOverrides.push({
      date: dateStr,
      type: 'block',
      availability: gridToAvailability(blocked, startHour.value),
    })
  }
  if (hasUnblocks) {
    newOverrides.push({
      date: dateStr,
      type: 'unblock',
      availability: gridToAvailability(unblocked, startHour.value),
    })
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

function isInDragRange(index: number) {
  if (painting.value === null) return false
  const minI = Math.min(dragStartSlot.value, dragCurrentSlot.value)
  const maxI = Math.max(dragStartSlot.value, dragCurrentSlot.value)
  return index >= minI && index <= maxI
}

function weeklySlotClass(dayIdx: number, slotIdx: number) {
  const day = DAY_KEYS[dayIdx]!
  const on = weeklyGrids.value[day][slotIdx]
  if (isInWeeklyDragRange(dayIdx, slotIdx)) {
    return painting.value === 'paint' ? 'bg-accent/50' : 'bg-secondary/20'
  }
  return on ? 'bg-accent' : 'bg-secondary/10'
}

function overrideSlotClass(index: number) {
  if (!overrideGrid.value) return 'bg-secondary/10'
  const cell = overrideGrid.value[index]
  if (!cell) return 'bg-secondary/10'
  const inRange = isInDragRange(index)

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
        v-for="tab in ['weekly', 'overrides'] as Tab[]"
        :key="tab"
        class="flex-1 py-2 rounded-lg font-heading font-bold text-sm transition-colors cursor-pointer"
        :class="
          activeTab === tab
            ? 'bg-accent text-bg'
            : 'bg-secondary/20 text-secondary hover:bg-secondary/30'
        "
        @click="activeTab = tab"
      >
        {{ t(tab === 'weekly' ? 'room.tabWeekly' : 'room.tabOverrides') }}
      </button>
    </div>

    <!-- Subtitle + info -->
    <div class="flex items-center gap-1.5 mb-1 px-1 justify-between">
      <p class="text-md text-primary font-bold font-heading">
        {{ t(activeTab === 'weekly' ? 'room.weeklySubtitle' : 'room.overridesSubtitle') }}
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
        {{ t(activeTab === 'weekly' ? 'room.weeklyInfo' : 'room.overridesInfo') }}
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
            {{ t(dayI18nKeys[day]) }}
          </div>

          <!-- Time slot rows -->
          <template v-for="i in slotCount" :key="i - 1">
            <div
              class="text-right pr-1 text-xs text-secondary font-heading flex items-center justify-end leading-none"
            >
              <span v-if="(i - 1) % 2 === 0">{{ formatSlotTime(i - 1, startHour) }}</span>
            </div>
            <div
              v-for="(day, dayIdx) in DAY_KEYS"
              :key="day"
              :data-day="dayIdx"
              :data-slot="i - 1"
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
    <template v-else>
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
          @update:model-value="onDateSelected"
        />
      </div>

      <!-- Override grid -->
      <template v-if="selectedDate && overrideGrid">
        <div class="flex-1 min-h-0 overflow-y-auto select-none">
          <div class="flex flex-col gap-px">
            <div v-for="i in slotCount" :key="i - 1" class="flex items-stretch min-h-7">
              <div
                class="w-12 shrink-0 text-right pr-2 text-xs text-secondary/60 font-heading flex items-center justify-end"
              >
                <span v-if="(i - 1) % 2 === 0">{{ formatSlotTime(i - 1, startHour) }}</span>
              </div>
              <div
                :data-slot="i - 1"
                class="flex-1 mr-5 lg:mr-0 rounded-sm transition-colors duration-75"
                style="touch-action: none"
                :class="overrideSlotClass(i - 1)"
                @pointerdown="onPointerDown"
                @pointermove="onPointerMove"
                @pointerup="onPointerUp"
                @pointercancel="onPointerUp"
              />
            </div>
          </div>
        </div>
      </template>

      <div v-else-if="!selectedDate" class="flex-1 flex items-center justify-center">
        <p class="text-secondary/60 font-heading text-sm">{{ t('room.noDateSelected') }}</p>
      </div>
    </template>

    <!-- Saved toast -->
    <Transition name="toast">
      <div
        v-if="savedVisible"
        class="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-accent text-bg text-sm font-heading font-bold shadow-lg"
      >
        {{ t('room.saved') }}
      </div>
    </Transition>
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
.toast-enter-active {
  transition: all 0.2s ease;
}
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>
