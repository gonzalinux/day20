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
const selectedDays = ref<DayKey[]>(['monday'])
const dayI18nKeys: Record<DayKey, string> = {
  monday: 'roomLogin.day_monday',
  tuesday: 'roomLogin.day_tuesday',
  wednesday: 'roomLogin.day_wednesday',
  thursday: 'roomLogin.day_thursday',
  friday: 'roomLogin.day_friday',
  saturday: 'roomLogin.day_saturday',
  sunday: 'roomLogin.day_sunday',
}

function toggleDay(day: DayKey) {
  const idx = selectedDays.value.indexOf(day)
  if (idx >= 0 && selectedDays.value.length > 1) {
    selectedDays.value.splice(idx, 1)
  } else if (idx < 0) {
    selectedDays.value.push(day)
  }
}

const startHour = computed(() => room.timeRange.startHour)
const endHour = computed(() => room.timeRange.endHour)
const slotCount = computed(() => (endHour.value - startHour.value) * 2)

const weeklyGrid = computed((): boolean[] => {
  const user = room.currentUser
  if (!user) return new Array(slotCount.value).fill(false) as boolean[]
  const firstDay = selectedDays.value[0] ?? 'monday'
  return availabilityToGrid(user.weeklyAvailability[firstDay] ?? [], startHour.value, endHour.value)
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
const dragStart = ref(-1)
const dragCurrent = ref(-1)

function getSlotIndex(e: PointerEvent) {
  const target = (e.target as HTMLElement).closest('[data-slot]')
  if (!target) return -1
  return parseInt((target as HTMLElement).dataset.slot!, 10)
}

function onPointerDown(e: PointerEvent) {
  const idx = getSlotIndex(e)
  if (idx < 0) return
  ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  dragStart.value = idx
  dragCurrent.value = idx

  if (activeTab.value === 'weekly') {
    painting.value = weeklyGrid.value[idx] ? 'erase' : 'paint'
  } else {
    if (!overrideGrid.value) return
    const cell = overrideGrid.value[idx]!
    painting.value = cell.effective ? 'erase' : 'paint'
  }
}

function onPointerMove(e: PointerEvent) {
  if (painting.value === null) return
  const el = document.elementFromPoint(e.clientX, e.clientY)
  if (!el) return
  const slot = (el as HTMLElement).closest('[data-slot]')
  if (!slot) return
  dragCurrent.value = parseInt((slot as HTMLElement).dataset.slot!, 10)
}

function onPointerUp() {
  if (painting.value === null) return
  const minI = Math.min(dragStart.value, dragCurrent.value)
  const maxI = Math.max(dragStart.value, dragCurrent.value)

  if (activeTab.value === 'weekly') {
    commitWeeklyPaint(minI, maxI)
  } else {
    commitOverridePaint(minI, maxI)
  }

  painting.value = null
  dragStart.value = -1
  dragCurrent.value = -1
}

function commitWeeklyPaint(minI: number, maxI: number) {
  const user = room.currentUser
  if (!user) return
  const grid = [...weeklyGrid.value]
  for (let i = minI; i <= maxI; i++) {
    grid[i] = painting.value === 'paint'
  }
  const newSelections = gridToAvailability(grid, startHour.value)
  const updated: WeeklyAvailability = { ...user.weeklyAvailability }
  for (const day of selectedDays.value) {
    updated[day] = newSelections
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

function isInDragRange(index: number) {
  if (painting.value === null) return false
  const minI = Math.min(dragStart.value, dragCurrent.value)
  const maxI = Math.max(dragStart.value, dragCurrent.value)
  return index >= minI && index <= maxI
}

function weeklySlotClass(index: number) {
  const on = weeklyGrid.value[index]
  const inRange = isInDragRange(index)
  if (inRange) {
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
  selectedDate.value = null
  calendarExpanded.value = true
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
    <div class="flex items-center gap-1.5 mb-1 px-1">
      <p class="text-md text-primary font-bold font-heading">
        {{ t(activeTab === 'weekly' ? 'room.weeklySubtitle' : 'room.overridesSubtitle') }}
      </p>
      <button
        class="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-secondary/50 hover:text-secondary hover:bg-secondary/15 transition-colors cursor-pointer text-xs font-bold"
        @click="showInfo = !showInfo"
      >
        ?
      </button>
    </div>

    <!-- Info tooltip -->
    <Transition name="info">
      <div
        v-if="showInfo"
        class="mx-1 mb-2 px-3 py-2 rounded-lg bg-secondary/10 text-xs text-secondary/80 font-body leading-relaxed"
      >
        {{ t(activeTab === 'weekly' ? 'room.weeklyInfo' : 'room.overridesInfo') }}
      </div>
    </Transition>

    <!-- Weekly mode -->
    <template v-if="activeTab === 'weekly'">
      <!-- Day chips -->
      <div class="flex gap-1.5 justify-center mb-2 flex-wrap">
        <button
          v-for="day in DAY_KEYS"
          :key="day"
          class="w-10 h-9 rounded-lg text-xs font-heading font-bold transition-colors cursor-pointer"
          :class="
            selectedDays.includes(day) ? 'bg-accent text-bg' : 'bg-secondary/20 text-secondary'
          "
          @click="toggleDay(day)"
        >
          {{ t(dayI18nKeys[day]) }}
        </button>
      </div>

      <!-- Time grid -->
      <div class="select-none">
        <div class="flex flex-col gap-px">
          <div v-for="i in slotCount" :key="i - 1" class="flex items-stretch min-h-7">
            <div
              class="w-12 shrink-0 text-right pr-2 text-xs text-secondary/60 font-heading flex items-center justify-end"
            >
              <span v-if="(i - 1) % 2 === 0">{{ formatSlotTime(i - 1, startHour) }}</span>
            </div>
            <div
              :data-slot="i - 1"
              class="flex-1 mr-10 lg:mr-0 rounded-sm transition-colors duration-75"
              style="touch-action: none"
              :class="weeklySlotClass(i - 1)"
              @pointerdown="onPointerDown"
              @pointermove="onPointerMove"
              @pointerup="onPointerUp"
              @pointercancel="onPointerUp"
            />
          </div>
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
                class="flex-1 mr-10 lg:mr-0 rounded-sm transition-colors duration-75"
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
