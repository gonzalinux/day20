<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { DEMO_START_HOUR, DEMO_TOTAL_SLOTS, DEMO_DAYS, DEMO_YOU } from './demoConstants'

const props = defineProps<{ roomName: string }>()
const emit = defineEmits<{ advance: [slots: boolean[][]] }>()

const { t } = useI18n()

const localSlots = ref<boolean[][]>(
  Array.from({ length: DEMO_DAYS.length }, () => new Array(DEMO_TOTAL_SLOTS).fill(false) as boolean[]),
)
const userEditing = ref(false)
const painting = ref<'paint' | 'erase' | null>(null)
const dragStartSlot = ref(-1)
const dragCurrentSlot = ref(-1)
const dragStartDay = ref(-1)
const dragCurrentDay = ref(-1)

let timers: ReturnType<typeof setTimeout>[] = []

function stopAutoPlay() {
  timers.forEach(clearTimeout)
  timers = []
  userEditing.value = true
}

function startAutoPlay() {
  let delay = 0
  for (let day = 0; day < DEMO_DAYS.length; day++) {
    for (let slot = 0; slot < DEMO_TOTAL_SLOTS; slot++) {
      if (DEMO_YOU[day]![slot]) {
        const d = day
        const s = slot
        timers.push(
          setTimeout(() => {
            if (!userEditing.value) localSlots.value[d]![s] = true
          }, delay),
        )
        delay += 25
      }
    }
  }
  delay += 1500
  timers.push(
    setTimeout(() => {
      if (!userEditing.value) emit('advance', localSlots.value.map((d) => [...d]))
    }, delay),
  )
}

function formatSlot(i: number): string {
  const totalMinutes = DEMO_START_HOUR * 60 + i * 30
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
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
  if (isInDragRange(dayIdx, slotIdx)) {
    return painting.value === 'paint' ? 'bg-accent/50' : 'bg-secondary/20'
  }
  return localSlots.value[dayIdx]![slotIdx] ? 'bg-accent' : 'bg-secondary/10'
}

function onPointerDown(e: PointerEvent) {
  stopAutoPlay()
  const el = (e.target as HTMLElement).closest('[data-slot]') as HTMLElement | null
  if (!el) return
  const slotIdx = parseInt(el.dataset.slot!, 10)
  const dayIdx = parseInt(el.dataset.day!, 10)
  if (isNaN(slotIdx) || isNaN(dayIdx)) return
  el.setPointerCapture(e.pointerId)
  dragStartSlot.value = slotIdx
  dragCurrentSlot.value = slotIdx
  dragStartDay.value = dayIdx
  dragCurrentDay.value = dayIdx
  painting.value = localSlots.value[dayIdx]![slotIdx] ? 'erase' : 'paint'
}

function onPointerMove(e: PointerEvent) {
  if (painting.value === null) return
  const el = document.elementFromPoint(e.clientX, e.clientY)
  if (!el) return
  const slot = (el as HTMLElement).closest('[data-slot]') as HTMLElement | null
  if (!slot) return
  dragCurrentSlot.value = parseInt(slot.dataset.slot!, 10)
  if (slot.dataset.day != null) dragCurrentDay.value = parseInt(slot.dataset.day, 10)
}

function onPointerUp() {
  if (painting.value === null) return
  const minDay = Math.min(dragStartDay.value, dragCurrentDay.value)
  const maxDay = Math.max(dragStartDay.value, dragCurrentDay.value)
  const minSlot = Math.min(dragStartSlot.value, dragCurrentSlot.value)
  const maxSlot = Math.max(dragStartSlot.value, dragCurrentSlot.value)
  for (let d = minDay; d <= maxDay; d++) {
    for (let s = minSlot; s <= maxSlot; s++) {
      localSlots.value[d]![s] = painting.value === 'paint'
    }
  }
  painting.value = null
  dragStartSlot.value = -1
  dragCurrentSlot.value = -1
  dragStartDay.value = -1
  dragCurrentDay.value = -1
}

const DAY_I18N: Record<string, string> = {
  Wed: 'roomLogin.day_wednesday',
  Thu: 'roomLogin.day_thursday',
  Sat: 'roomLogin.day_saturday',
}

onMounted(startAutoPlay)
onUnmounted(() => timers.forEach(clearTimeout))
</script>

<template>
  <div class="bg-bg rounded-2xl shadow-xl p-6 w-full max-w-sm mx-auto">
    <p class="text-lg font-heading text-accent font-bold mb-3 text-center truncate">{{ props.roomName }}</p>
    <div
      class="select-none"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <div class="grid gap-x-1 gap-y-px" style="grid-template-columns: 2.5rem repeat(3, 1fr)">
        <div />
        <div
          v-for="day in DEMO_DAYS"
          :key="day"
          class="text-center text-xs font-heading font-bold pb-1 text-secondary"
        >
          {{ t(DAY_I18N[day]!) }}
        </div>

        <template v-for="i in DEMO_TOTAL_SLOTS" :key="i - 1">
          <div class="text-right pr-1 text-xs text-secondary font-heading flex items-center justify-end leading-none">
            <span v-if="(i - 1) % 2 === 0">{{ formatSlot(i - 1) }}</span>
          </div>
          <div
            v-for="(_, dayIdx) in DEMO_DAYS"
            :key="dayIdx"
            :data-day="dayIdx"
            :data-slot="i - 1"
            class="rounded-sm transition-colors duration-75 min-h-6"
            style="touch-action: none"
            :class="slotClass(dayIdx, i - 1)"
          />
        </template>
      </div>
    </div>
    <button
      v-if="userEditing"
      class="mt-4 w-full bg-accent text-bg font-heading font-bold py-2 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
      @click="emit('advance', localSlots.map((d) => [...d]))"
    >
      {{ t('roomLogin.next') }} →
    </button>
  </div>
</template>
