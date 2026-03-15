import { ref, computed } from 'vue'
import { getMondayOfWeek } from '@/utils/availability'

export function useWeekPicker(initialDate?: Date) {
  const selectedWeekStart = ref(getMondayOfWeek(initialDate ?? new Date()))
  const calendarExpanded = ref(true)

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

  return {
    selectedWeekStart,
    calendarExpanded,
    weekDates,
    weekMonthLabel,
    onDateSelected,
    toggleCalendar,
    prevWeek,
    nextWeek,
  }
}
