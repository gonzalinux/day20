<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  type DayKey,
  type WeeklyAvailability,
  DAY_KEYS,
  availabilityToGrid,
  gridToAvailability,
  formatSlotTime,
} from '@/utils/availability'

const props = defineProps<{ defaultAvailability: WeeklyAvailability }>()
const emit = defineEmits<{ save: [availability: WeeklyAvailability]; close: [] }>()

const { t } = useI18n()

const availability = ref<WeeklyAvailability>(JSON.parse(JSON.stringify(props.defaultAvailability)))

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

const START_HOUR = 0
const END_HOUR = 24
const SLOT_COUNT = (END_HOUR - START_HOUR) * 2

const grid = computed((): boolean[] => {
  const firstDay = selectedDays.value[0] ?? 'monday'
  return availabilityToGrid(availability.value[firstDay] ?? [], START_HOUR, END_HOUR)
})

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
  painting.value = grid.value[idx] ? 'erase' : 'paint'
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

  const newGrid = [...grid.value]
  for (let i = minI; i <= maxI; i++) {
    newGrid[i] = painting.value === 'paint'
  }
  const selections = gridToAvailability(newGrid, START_HOUR)
  for (const day of selectedDays.value) {
    availability.value[day] = selections
  }

  painting.value = null
  dragStart.value = -1
  dragCurrent.value = -1
}

function isInDragRange(index: number) {
  if (painting.value === null) return false
  const minI = Math.min(dragStart.value, dragCurrent.value)
  const maxI = Math.max(dragStart.value, dragCurrent.value)
  return index >= minI && index <= maxI
}

function slotClass(index: number) {
  const on = grid.value[index]
  const inRange = isInDragRange(index)
  if (inRange) {
    return painting.value === 'paint' ? 'bg-accent/50' : 'bg-secondary/20'
  }
  return on ? 'bg-accent' : 'bg-secondary/10'
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center" @click.self="emit('close')">
      <div class="absolute inset-0 bg-black/50" />
      <div class="relative rounded-2xl bg-bg shadow-xl p-4 w-full max-w-sm mx-4 max-h-[85vh] flex flex-col">
        <h3 class="text-xl font-heading font-bold text-accent mb-3">
          {{ t('room.editTimeWindow') }}
        </h3>

        <!-- Day chips -->
        <div class="flex gap-1.5 justify-center mb-3 flex-wrap">
          <button
            v-for="day in DAY_KEYS"
            :key="day"
            class="w-10 h-9 rounded-lg text-xs font-heading font-bold transition-colors cursor-pointer"
            :class="selectedDays.includes(day) ? 'bg-accent text-bg' : 'bg-secondary/20 text-secondary'"
            @click="toggleDay(day)"
          >
            {{ t(dayI18nKeys[day]) }}
          </button>
        </div>

        <!-- Time grid -->
        <div class="flex-1 min-h-0 overflow-y-auto select-none">
          <div class="flex flex-col gap-px">
            <div v-for="i in SLOT_COUNT" :key="i - 1" class="flex items-stretch min-h-6">
              <div class="w-11 shrink-0 text-right pr-2 text-xs text-secondary/60 font-heading flex items-center justify-end">
                <span v-if="(i - 1) % 2 === 0">{{ formatSlotTime(i - 1, START_HOUR) }}</span>
              </div>
              <div
                :data-slot="i - 1"
                class="flex-1 mr-8 lg:mr-0 rounded-sm transition-colors duration-75"
                style="touch-action: none"
                :class="slotClass(i - 1)"
                @pointerdown="onPointerDown"
                @pointermove="onPointerMove"
                @pointerup="onPointerUp"
                @pointercancel="onPointerUp"
              />
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 mt-3 shrink-0">
          <button
            class="flex-1 px-4 py-3 rounded-lg bg-secondary/20 text-primary font-heading font-bold hover:bg-secondary/30 transition-colors cursor-pointer"
            @click="emit('close')"
          >
            {{ t('room.durationCancel') }}
          </button>
          <button
            class="flex-1 px-4 py-3 rounded-lg bg-accent text-bg font-heading font-bold hover:opacity-90 transition-opacity cursor-pointer"
            @click="emit('save', availability)"
          >
            {{ t('room.durationSave') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
