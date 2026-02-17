<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DAY_KEYS, DAY_I18N_KEYS, formatDateKey } from '@/utils/availability'

const { t } = useI18n()

const props = defineProps<{
  overrideDates: string[]
  modelValue: Date | null
  highlightWeek?: Date | null
}>()

const emit = defineEmits<{
  'update:modelValue': [date: Date]
}>()

const viewDate = ref(new Date())

const year = computed(() => viewDate.value.getFullYear())
const month = computed(() => viewDate.value.getMonth())

const monthName = computed(() =>
  viewDate.value.toLocaleString(undefined, { month: 'long', year: 'numeric' }),
)

const days = computed(() => {
  const first = new Date(year.value, month.value, 1)
  const startDow = (first.getDay() + 6) % 7
  const lastDay = new Date(year.value, month.value + 1, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= lastDay; d++) cells.push(d)
  return cells
})

const today = new Date()
const todayKey = formatDateKey(today)

function dateKey(day: number) {
  return formatDateKey(new Date(year.value, month.value, day))
}

function isSelected(day: number) {
  if (!props.modelValue) return false
  return dateKey(day) === formatDateKey(props.modelValue)
}

function hasOverride(day: number) {
  return props.overrideDates.includes(dateKey(day))
}

function isToday(day: number) {
  return dateKey(day) === todayKey
}

function isInHighlightWeek(day: number) {
  if (!props.highlightWeek) return false
  const d = new Date(year.value, month.value, day)
  const mon = props.highlightWeek.getTime()
  const sun = mon + 6 * 86400000
  const t = d.getTime()
  return t >= mon && t <= sun
}

function highlightWeekPosition(day: number): 'start' | 'end' | 'mid' | null {
  if (!isInHighlightWeek(day)) return null
  const d = new Date(year.value, month.value, day)
  const dow = (d.getDay() + 6) % 7
  if (dow === 0) return 'start'
  if (dow === 6) return 'end'
  return 'mid'
}

function selectDay(day: number) {
  emit('update:modelValue', new Date(year.value, month.value, day))
}

function prevMonth() {
  viewDate.value = new Date(year.value, month.value - 1, 1)
}

function nextMonth() {
  viewDate.value = new Date(year.value, month.value + 1, 1)
}
</script>

<template>
  <div class="select-none">
    <div class="flex items-center justify-between mb-2">
      <button
        class="text-secondary hover:text-primary transition-colors cursor-pointer px-2 py-1"
        aria-label="Previous month"
        @click="prevMonth"
      >
        <VIcon name="gi-arrow-dunk" class="rotate-90" scale="0.8" />
      </button>
      <span class="font-heading font-bold text-primary capitalize text-sm">{{ monthName }}</span>
      <button
        class="text-secondary hover:text-primary transition-colors cursor-pointer px-2 py-1"
        aria-label="Next month"
        @click="nextMonth"
      >
        <VIcon name="gi-arrow-dunk" class="-rotate-90" scale="0.8" />
      </button>
    </div>

    <div class="grid grid-cols-7 gap-0.5 text-center text-xs font-heading">
      <span v-for="day in DAY_KEYS" :key="day" class="text-secondary/60 py-1">
        {{ t(DAY_I18N_KEYS[day]) }}
      </span>
      <template v-for="(day, i) in days" :key="i">
        <div v-if="day === null" />
        <button
          v-else
          class="relative w-8 h-8 mx-auto flex items-center justify-center text-xs cursor-pointer transition-colors"
          :class="[
            isSelected(day)
              ? 'bg-accent text-bg font-bold rounded-lg'
              : isToday(day)
                ? 'bg-primary/20 text-primary font-bold rounded-lg'
                : 'text-secondary hover:bg-secondary/15 rounded-lg',
            isInHighlightWeek(day) && !isSelected(day) ? 'ring-1 ring-accent/40' : '',
            highlightWeekPosition(day) === 'start' ? 'rounded-r-none' : '',
            highlightWeekPosition(day) === 'end' ? 'rounded-l-none' : '',
            highlightWeekPosition(day) === 'mid' ? 'rounded-none' : '',
          ]"
          @click="selectDay(day)"
        >
          {{ day }}
          <span
            v-if="hasOverride(day)"
            class="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
            :class="isSelected(day) ? 'bg-bg' : 'bg-accent'"
          />
        </button>
      </template>
    </div>
  </div>
</template>
