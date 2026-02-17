<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  type DayKey,
  type WeeklyAvailability,
  DAY_KEYS,
  DAY_I18N_KEYS,
  availabilityToGrid,
  gridToAvailability,
  formatSlotTime,
} from '@/utils/availability'
import { useRoomStore } from '@/stores/room'

const props = defineProps<{ defaultAvailability: WeeklyAvailability }>()
const emit = defineEmits<{ save: [availability: WeeklyAvailability]; close: [] }>()

const { t } = useI18n()

const roomStore = useRoomStore()
const availability = ref<WeeklyAvailability>(JSON.parse(JSON.stringify(props.defaultAvailability)))

const START_HOUR = 0
const END_HOUR = 24
const SLOT_COUNT = (END_HOUR - START_HOUR) * 2

const grids = computed(() => {
  return Object.fromEntries(
    DAY_KEYS.map((d) => [
      d,
      availabilityToGrid(availability.value[d] ?? [], START_HOUR, END_HOUR),
    ]),
  ) as Record<DayKey, boolean[]>
})

type PaintMode = 'paint' | 'erase' | null
const painting = ref<PaintMode>(null)
const dragStartSlot = ref(-1)
const dragCurrentSlot = ref(-1)
const dragStartDay = ref(-1)
const dragCurrentDay = ref(-1)

function onPointerDown(e: PointerEvent) {
  const el = (e.target as HTMLElement).closest('[data-slot]') as HTMLElement | null
  if (!el) return
  ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)

  const slotIdx = parseInt(el.dataset.slot!, 10)
  const dayIdx = parseInt(el.dataset.day!, 10)
  if (isNaN(dayIdx)) return

  dragStartSlot.value = slotIdx
  dragCurrentSlot.value = slotIdx
  dragStartDay.value = dayIdx
  dragCurrentDay.value = dayIdx

  const day = DAY_KEYS[dayIdx]!
  painting.value = grids.value[day][slotIdx] ? 'erase' : 'paint'
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

  const minDay = Math.min(dragStartDay.value, dragCurrentDay.value)
  const maxDay = Math.max(dragStartDay.value, dragCurrentDay.value)
  const minSlot = Math.min(dragStartSlot.value, dragCurrentSlot.value)
  const maxSlot = Math.max(dragStartSlot.value, dragCurrentSlot.value)

  for (let d = minDay; d <= maxDay; d++) {
    const day = DAY_KEYS[d]!
    const grid = [...grids.value[day]]
    for (let s = minSlot; s <= maxSlot; s++) {
      grid[s] = painting.value === 'paint'
    }
    availability.value[day] = gridToAvailability(grid, START_HOUR)
  }

  painting.value = null
  dragStartSlot.value = -1
  dragCurrentSlot.value = -1
  dragStartDay.value = -1
  dragCurrentDay.value = -1
}

function isInDragRange(dayIdx: number, slotIdx: number) {
  if (painting.value === null || dragStartDay.value < 0) return false
  const minDay = Math.min(dragStartDay.value, dragCurrentDay.value)
  const maxDay = Math.max(dragStartDay.value, dragCurrentDay.value)
  const minSlot = Math.min(dragStartSlot.value, dragCurrentSlot.value)
  const maxSlot = Math.max(dragStartSlot.value, dragCurrentSlot.value)
  return dayIdx >= minDay && dayIdx <= maxDay && slotIdx >= minSlot && slotIdx <= maxSlot
}

function slotClass(dayIdx: number, slotIdx: number) {
  const day = DAY_KEYS[dayIdx]!
  const on = grids.value[day][slotIdx]
  if (isInDragRange(dayIdx, slotIdx)) {
    return painting.value === 'paint' ? 'bg-accent/50' : 'bg-secondary/20'
  }
  return on ? 'bg-accent' : 'bg-secondary/10'
}

const scrollContainer = ref<HTMLElement | null>(null)

onMounted(async () => {
  await nextTick()
  const firstGrid = grids.value[DAY_KEYS[0]!]
  const firstOn = firstGrid.indexOf(true)
  if (firstOn > 0 && scrollContainer.value) {
    const slotHeight = scrollContainer.value.scrollHeight / SLOT_COUNT
    const offset = Math.max(0, firstOn - 2) * slotHeight
    scrollContainer.value.scrollTop = offset
  }
})
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center" @click.self="emit('close')">
      <div class="absolute inset-0 bg-black/50" />
      <div
        class="relative rounded-2xl bg-bg shadow-xl p-4 w-full max-w-lg mx-4 max-h-[85vh] flex flex-col"
      >
        <h3 class="text-xl font-heading font-bold text-accent mb-1">
          {{ t('room.editTimeWindow') }}
        </h3>
        <p class="text-xs text-secondary/50 font-heading mb-3">
          {{ t('room.timeWindowTimezone', { tz: roomStore.room.timezone }) }}
        </p>

        <!-- Time grid -->
        <div ref="scrollContainer" class="flex-1 min-h-0 overflow-y-auto select-none">
          <div
            class="grid gap-x-0.5 gap-y-px"
            style="grid-template-columns: 2.5rem repeat(7, 1fr)"
          >
            <!-- Day headers -->
            <div class="sticky top-0 z-10 bg-bg" />
            <div
              v-for="day in DAY_KEYS"
              :key="'h-' + day"
              class="sticky top-0 z-10 bg-bg text-center text-xs font-heading font-bold pb-1 text-secondary"
            >
              {{ t(DAY_I18N_KEYS[day]) }}
            </div>

            <!-- Time slot rows -->
            <template v-for="i in SLOT_COUNT" :key="i - 1">
              <div
                class="text-right pr-1 text-[10px] text-secondary/60 font-heading flex items-center justify-end leading-none"
              >
                <span v-if="(i - 1) % 2 === 0">{{ formatSlotTime(i - 1, START_HOUR) }}</span>
              </div>
              <div
                v-for="(day, dayIdx) in DAY_KEYS"
                :key="day"
                :data-day="dayIdx"
                :data-slot="i - 1"
                class="rounded-sm transition-colors duration-75 min-h-5"
                style="touch-action: none"
                :class="slotClass(dayIdx, i - 1)"
                @pointerdown="onPointerDown"
                @pointermove="onPointerMove"
                @pointerup="onPointerUp"
                @pointercancel="onPointerUp"
              />
            </template>
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
