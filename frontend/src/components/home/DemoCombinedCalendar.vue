<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DEMO_START_HOUR, DEMO_TOTAL_SLOTS, DEMO_DAYS, ALICE, JOHN } from './demoConstants'

const props = defineProps<{ roomName: string; userSlots: boolean[][] }>()
const emit = defineEmits<{ restart: [] }>()

const { t } = useI18n()

const DAY_I18N: Record<string, string> = {
  Wed: 'roomLogin.day_wednesday',
  Thu: 'roomLogin.day_thursday',
  Sat: 'roomLogin.day_saturday',
}

const users = computed(() => [
  { name: t('room.you') || 'You', slots: props.userSlots },
  { name: 'Alice', slots: ALICE },
  { name: 'John', slots: JOHN },
])

const totalUsers = computed(() => users.value.length)

const combinedGrid = computed(() => {
  const grid: number[][] = []
  for (let dayIdx = 0; dayIdx < DEMO_DAYS.length; dayIdx++) {
    const slots = new Array(DEMO_TOTAL_SLOTS).fill(0) as number[]
    for (let ui = 0; ui < users.value.length; ui++) {
      const userDay = users.value[ui]!.slots[dayIdx] ?? []
      for (let s = 0; s < DEMO_TOTAL_SLOTS; s++) {
        if (userDay[s]) slots[s] = (slots[s] ?? 0) + 1
      }
    }
    grid.push(slots)
  }
  return grid
})

const viableSlots = computed(() => {
  const minSlots = 4
  const viable: boolean[][] = []
  for (let dayIdx = 0; dayIdx < DEMO_DAYS.length; dayIdx++) {
    const daySlots = combinedGrid.value[dayIdx]!
    const isViable = new Array(DEMO_TOTAL_SLOTS).fill(false) as boolean[]
    let streak = 0
    for (let s = 0; s < DEMO_TOTAL_SLOTS; s++) {
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
      for (let j = DEMO_TOTAL_SLOTS - streak; j < DEMO_TOTAL_SLOTS; j++) isViable[j] = true
    }
    viable.push(isViable)
  }
  return viable
})

function slotClass(dayIdx: number, slotIdx: number) {
  const count = combinedGrid.value[dayIdx]![slotIdx]!
  const total = totalUsers.value
  if (total === 0 || count === 0) return 'bg-secondary/10'
  if (count === total) {
    if (viableSlots.value[dayIdx]![slotIdx]) return 'bg-green-400/60 ring-1 ring-green-400/50'
    return 'bg-accent/70'
  }
  const fraction = count / total
  if (fraction > 0.5) return 'bg-accent/40'
  if (fraction > 0.25) return 'bg-accent/25'
  return 'bg-accent/15'
}

function formatSlot(i: number): string {
  const totalMinutes = DEMO_START_HOUR * 60 + i * 30
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

const tooltipCell = ref<{ dayIdx: number; slotIdx: number } | null>(null)
const tooltipAnchorRect = ref<DOMRect | null>(null)

const tooltipData = computed(() => {
  if (!tooltipCell.value) return null
  const { dayIdx, slotIdx } = tooltipCell.value
  const available = users.value.filter((u) => u.slots[dayIdx]?.[slotIdx])
  const unavailable = users.value.filter((u) => !u.slots[dayIdx]?.[slotIdx])
  const timeLabel = formatSlot(slotIdx)
  const timeEnd = formatSlot(slotIdx + 1)
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

function showTooltip(event: MouseEvent, dayIdx: number, slotIdx: number) {
  tooltipAnchorRect.value = (event.currentTarget as HTMLElement).getBoundingClientRect()
  tooltipCell.value = { dayIdx, slotIdx }
}

function hideTooltip() {
  tooltipCell.value = null
}
</script>

<template>
  <div class="bg-bg rounded-2xl shadow-xl p-6 w-full max-w-sm mx-auto">
    <p class="text-lg font-heading text-accent font-bold mb-3 text-center truncate">{{ props.roomName }}</p>

    <div class="flex flex-wrap gap-x-3 gap-y-1 mb-3 text-xs font-heading text-secondary">
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
    </div>

    <div class="select-none">
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
            class="rounded-sm transition-colors duration-75 min-h-6 touch-none cursor-default"
            :class="slotClass(dayIdx, i - 1)"
            :data-day="dayIdx"
            :data-slot="i - 1"
            @mouseenter="showTooltip($event, dayIdx, i - 1)"
            @mouseleave="hideTooltip"
          />
        </template>
      </div>
    </div>

    <button
      class="mt-4 w-full text-sm font-heading text-secondary hover:text-primary transition-colors cursor-pointer py-1"
      @click="emit('restart')"
    >
      ↺ {{ t('home.demoRestart') }}
    </button>
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
            :key="user.name"
            class="flex items-center gap-1.5 text-xs text-secondary"
          >
            <span class="w-2 h-2 rounded-full bg-green-400 shrink-0" />
            {{ user.name }}
          </div>
          <div
            v-for="user in tooltipData.unavailable"
            :key="user.name"
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
